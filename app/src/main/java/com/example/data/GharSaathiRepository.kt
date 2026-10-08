package com.example.data

import com.example.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.UUID
import kotlin.math.*

object GharSaathiRepository {
  private val scope = CoroutineScope(Dispatchers.Default + Job())

  // Current active role & user selection
  private val _currentRole = MutableStateFlow(UserRole.CUSTOMER)
  val currentRole: StateFlow<UserRole> = _currentRole.asStateFlow()

  private val _activeProviderId = MutableStateFlow("prov_2") // Default: Suresh Patel (AC)
  val activeProviderId: StateFlow<String> = _activeProviderId.asStateFlow()

  // Customer Profile (Rahul)
  private val _customerProfile = MutableStateFlow(
    CustomerProfile(
      id = "cust_rahul",
      name = "Rahul Sharma",
      phone = "+91 98765 43210",
      email = "rahul.sharma@example.com",
      address = "Flat 402, Lotus Boulevard, Sector 62, Noida, UP",
      latitude = 28.5350,
      longitude = 77.3910
    )
  )
  val customerProfile: StateFlow<CustomerProfile> = _customerProfile.asStateFlow()

  // Providers State
  private val _providers = MutableStateFlow<List<ProviderProfile>>(SeedData.initialProviders)
  val providers: StateFlow<List<ProviderProfile>> = _providers.asStateFlow()

  // Active Service Requests
  private val _requests = MutableStateFlow<List<ServiceRequest>>(emptyList())
  val requests: StateFlow<List<ServiceRequest>> = _requests.asStateFlow()

  // Active & Past Bookings
  private val _bookings = MutableStateFlow<List<Booking>>(emptyList())
  val bookings: StateFlow<List<Booking>> = _bookings.asStateFlow()

  // Inquiries
  private val _inquiries = MutableStateFlow<List<Inquiry>>(
    listOf(
      Inquiry(
        id = "INQ-101",
        customerName = "Pooja Verma",
        customerPhone = "+91 99112 88442",
        serviceCategory = "AC Services",
        queryText = "AC gas charging kitne ki hogi split AC ke liye?",
        status = InquiryStatus.NEW,
        createdAt = System.currentTimeMillis() - 1000 * 60 * 35
      ),
      Inquiry(
        id = "INQ-102",
        customerName = "Anil Saxena",
        customerPhone = "+91 97123 44556",
        serviceCategory = "Home Repairs",
        queryText = "Full 3BHK electrical wiring check and MCB upgrade quote chahiye.",
        status = InquiryStatus.QUOTED,
        quotedPrice = 1200.0,
        createdAt = System.currentTimeMillis() - 1000 * 60 * 120
      )
    )
  )
  val inquiries: StateFlow<List<Inquiry>> = _inquiries.asStateFlow()

  // Complaints
  private val _complaints = MutableStateFlow<List<Complaint>>(
    listOf(
      Complaint(
        id = "CMP-501",
        bookingId = "GS-1002",
        customerName = "Vikas Mehra",
        providerName = "Amit Sharma",
        subject = "Minor delay in arrival",
        description = "Provider arrived 20 minutes later than scheduled time due to rain.",
        status = ComplaintStatus.RESOLVED,
        createdAt = System.currentTimeMillis() - 1000 * 60 * 60 * 24
      )
    )
  )
  val complaints: StateFlow<List<Complaint>> = _complaints.asStateFlow()

  // Coupons
  val coupons = listOf(
    Coupon("FIRST50", "Flat ₹50 OFF", 15, 50.0, 199.0, "Valid on first service request"),
    Coupon("GHARSAATHI100", "Save ₹100", 20, 100.0, 499.0, "Special festival home service discount"),
    Coupon("REPAIR20", "20% OFF Repairs", 20, 80.0, 249.0, "Valid on AC & Home Repairs")
  )

  // Notifications
  private val _notifications = MutableStateFlow<List<NotificationItem>>(
    listOf(
      NotificationItem(
        id = "notif_welcome",
        targetRole = UserRole.CUSTOMER,
        title = "Welcome to GharSaathi!",
        message = "घर के हर काम का भरोसेमंद साथी। Book your first service today."
      )
    )
  )
  val notifications: StateFlow<List<NotificationItem>> = _notifications.asStateFlow()

  // Chat Messages
  private val _chatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
  val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()

  // Real-Time Dispatch Timer State (Remaining seconds for active offer: requestId -> seconds remaining)
  private val _offerCountdowns = MutableStateFlow<Map<String, Int>>(emptyMap())
  val offerCountdowns: StateFlow<Map<String, Int>> = _offerCountdowns.asStateFlow()

  // Track rejected provider IDs per request so we don't re-offer immediately
  private val rejectedProvidersMap = mutableMapOf<String, MutableSet<String>>()

  // Concurrency Lock for Atomic Assignment
  private val assignmentLock = Any()

  init {
    startDispatchEngineLoop()
  }

  fun setRole(role: UserRole) {
    _currentRole.value = role
  }

  fun setActiveProvider(providerId: String) {
    _activeProviderId.value = providerId
  }

  fun toggleProviderAvailability(providerId: String) {
    _providers.value = _providers.value.map {
      if (it.id == providerId) {
        val next = if (it.availability == ProviderAvailability.ONLINE) ProviderAvailability.OFFLINE else ProviderAvailability.ONLINE
        it.copy(availability = next)
      } else it
    }
  }

  fun updateCustomerAddress(newAddress: String, lat: Double, lng: Double) {
    _customerProfile.value = _customerProfile.value.copy(
      address = newAddress,
      latitude = lat,
      longitude = lng
    )
  }

  // --- Real-Time Dispatch Engine Coroutine Loop ---
  private fun startDispatchEngineLoop() {
    scope.launch {
      while (isActive) {
        delay(1000)
        tickDispatchTimers()
        simulateProviderLiveMovement()
      }
    }
  }

  private fun tickDispatchTimers() {
    val currentCountdowns = _offerCountdowns.value.toMutableMap()
    val activeRequests = _requests.value

    for (req in activeRequests) {
      if (req.status == BookingStatus.SEARCHING && req.offeredToProviderId != null) {
        val remaining = currentCountdowns[req.id] ?: 25
        if (remaining > 1) {
          currentCountdowns[req.id] = remaining - 1
        } else {
          // Timer Expired (25 seconds up!)
          currentCountdowns.remove(req.id)
          handleOfferExpired(req)
        }
      }
    }
    _offerCountdowns.value = currentCountdowns
  }

  private fun simulateProviderLiveMovement() {
    val activeBookings = _bookings.value
    var updated = false

    val updatedList = activeBookings.map { booking ->
      if (booking.status == BookingStatus.PROVIDER_ON_THE_WAY) {
        // Move provider slightly closer to customer location
        val step = 0.0003
        val deltaLat = booking.customerLat - booking.providerLat
        val deltaLng = booking.customerLng - booking.providerLng
        val dist = sqrt(deltaLat * deltaLat + deltaLng * deltaLng)

        if (dist > 0.0004) {
          updated = true
          val nextLat = booking.providerLat + (deltaLat / dist) * step
          val nextLng = booking.providerLng + (deltaLng / dist) * step
          val newEta = max(1, ((dist / 0.0003) * 1.2).toInt())
          booking.copy(
            providerLat = nextLat,
            providerLng = nextLng,
            etaMinutes = newEta
          )
        } else {
          // Arrived!
          updated = true
          postNotification(
            UserRole.CUSTOMER,
            "Provider Arrived!",
            "${booking.providerName} has arrived at your address. Share OTP ${booking.otp} to start.",
            booking.id
          )
          booking.copy(
            status = BookingStatus.ARRIVED,
            etaMinutes = 0
          )
        }
      } else {
        booking
      }
    }

    if (updated) {
      _bookings.value = updatedList
    }
  }

  // --- Customer Initiates Service Request ---
  fun requestService(
    service: HomeService,
    description: String,
    urgency: UrgencyLevel,
    preferredDate: String,
    preferredTime: String,
    paymentPref: PaymentMethod
  ): ServiceRequest {
    val cust = _customerProfile.value
    val reqId = "GS-" + (10000 + (Math.random() * 89999).toInt())

    val newReq = ServiceRequest(
      id = reqId,
      customerId = cust.id,
      customerName = cust.name,
      customerPhone = cust.phone,
      categoryId = service.categoryId,
      serviceId = service.id,
      serviceName = service.name,
      description = if (description.isNotBlank()) description else "General servicing and inspection required.",
      address = cust.address,
      latitude = cust.latitude,
      longitude = cust.longitude,
      urgency = urgency,
      preferredDate = preferredDate,
      preferredTime = preferredTime,
      paymentPreference = paymentPref,
      status = BookingStatus.SEARCHING
    )

    _requests.value = listOf(newReq) + _requests.value
    rejectedProvidersMap[reqId] = mutableSetOf()

    postNotification(
      UserRole.ADMIN,
      "New Live Request: ${newReq.id}",
      "${newReq.serviceName} requested by ${newReq.customerName} (${urgency.label})",
      reqId
    )

    // Trigger dispatch calculation
    dispatchToBestCandidate(newReq)

    return newReq
  }

  private fun dispatchToBestCandidate(request: ServiceRequest) {
    val rejected = rejectedProvidersMap[request.id] ?: mutableSetOf()
    val onlineProviders = _providers.value.filter {
      it.availability == ProviderAvailability.ONLINE &&
      it.activeBookingId == null &&
      !rejected.contains(it.id)
    }

    // Filter by skill or category match
    val matchingCandidates = onlineProviders.filter { provider ->
      provider.categories.contains(request.categoryId) ||
      provider.skills.any { skill ->
        request.serviceName.contains(skill, ignoreCase = true) ||
        skill.contains(request.serviceName, ignoreCase = true)
      }
    }

    if (matchingCandidates.isEmpty()) {
      // Expand search radius or mark unassigned if exhausted
      val expandedRadius = request.searchRadiusKm + 5.0
      if (expandedRadius <= 15.0) {
        val updatedReq = request.copy(searchRadiusKm = expandedRadius)
        updateRequest(updatedReq)
        // Check all online providers in category
        val anyInCat = _providers.value.filter {
          it.availability == ProviderAvailability.ONLINE &&
          it.categories.contains(request.categoryId) &&
          !rejected.contains(it.id)
        }
        if (anyInCat.isNotEmpty()) {
          rankAndOffer(updatedReq, anyInCat)
          return
        }
      }

      // No provider available -> Escalate to support and Admin
      val unassignedReq = request.copy(status = BookingStatus.CANCELLED)
      updateRequest(unassignedReq)
      postNotification(
        UserRole.CUSTOMER,
        "All Technicians Busy",
        "We are actively arranging a verified professional. Call priority support at ${SeedData.BUSINESS_PHONE}.",
        request.id
      )
      postNotification(
        UserRole.ADMIN,
        "UNASSIGNED ALERT: ${request.id}",
        "No available provider found for ${request.serviceName}. Requires manual assistance.",
        request.id
      )
      return
    }

    rankAndOffer(request, matchingCandidates)
  }

  private fun rankAndOffer(request: ServiceRequest, candidates: List<ProviderProfile>) {
    // Scoring Formula:
    // Distance (30%) + Skill match (30%) + Rating (15%) + Availability (15%) + Response rate (10%)
    val scoredCandidates = candidates.map { provider ->
      val distKm = calculateDistanceKm(request.latitude, request.longitude, provider.latitude, provider.longitude)
      val distScore = max(0.0, (10.0 - distKm) / 10.0) * 30.0
      val skillScore = 30.0
      val ratingScore = (provider.rating / 5.0) * 15.0
      val availScore = 15.0
      val respScore = (provider.responseRate / 100.0) * 10.0
      val totalScore = distScore + skillScore + ratingScore + availScore + respScore
      Pair(provider, totalScore)
    }.sortedByDescending { it.second }

    val chosenProvider = scoredCandidates.first().first

    // Offer to this provider with 25-second countdown
    val expiresAt = System.currentTimeMillis() + 25000L
    val updatedReq = request.copy(
      offeredToProviderId = chosenProvider.id,
      offerExpiresAtMillis = expiresAt
    )
    updateRequest(updatedReq)

    val currentCountdowns = _offerCountdowns.value.toMutableMap()
    currentCountdowns[request.id] = 25
    _offerCountdowns.value = currentCountdowns

    // Alert the chosen provider
    postNotification(
      UserRole.PROVIDER,
      "⚡ NEW SERVICE REQUEST: ${request.serviceName}",
      "Customer: ${request.customerName} • 25s to Accept! Estimated ₹299+",
      request.id
    )
  }

  private fun handleOfferExpired(request: ServiceRequest) {
    val expiredProvId = request.offeredToProviderId
    if (expiredProvId != null) {
      rejectedProvidersMap.getOrPut(request.id) { mutableSetOf() }.add(expiredProvId)
    }

    val resetReq = request.copy(
      offeredToProviderId = null,
      offerExpiresAtMillis = 0L
    )
    updateRequest(resetReq)

    // Dispatch to next provider or expand radius
    dispatchToBestCandidate(resetReq)
  }

  fun rejectRequest(requestId: String, providerId: String) {
    val req = _requests.value.find { it.id == requestId } ?: return
    if (req.offeredToProviderId == providerId) {
      val countdowns = _offerCountdowns.value.toMutableMap()
      countdowns.remove(requestId)
      _offerCountdowns.value = countdowns

      rejectedProvidersMap.getOrPut(requestId) { mutableSetOf() }.add(providerId)

      val resetReq = req.copy(offeredToProviderId = null, offerExpiresAtMillis = 0L)
      updateRequest(resetReq)

      // Immediately dispatch to next provider
      dispatchToBestCandidate(resetReq)
    }
  }

  // --- CRITICAL CONCURRENCY RULE: Atomic Accept ---
  fun acceptRequest(requestId: String, providerId: String): Boolean {
    synchronized(assignmentLock) {
      val req = _requests.value.find { it.id == requestId }
      if (req == null || req.status != BookingStatus.SEARCHING) {
        return false // Request is no longer available!
      }
      if (req.assignedProviderId != null && req.assignedProviderId != providerId) {
        return false // Another provider already won
      }

      val prov = _providers.value.find { it.id == providerId } ?: return false

      // Clear countdown
      val countdowns = _offerCountdowns.value.toMutableMap()
      countdowns.remove(requestId)
      _offerCountdowns.value = countdowns

      // Generate 4-digit Secure OTP
      val otpCode = ((1000 + (Math.random() * 8999).toInt())).toString()

      // Calculate initial pricing
      val service = SeedData.services.find { it.id == req.serviceId }
      val basePrice = service?.basePrice ?: 299.0
      val platformCommission = basePrice * 0.20
      val providerEarnings = basePrice * 0.80

      val bookingId = "BK-" + (20000 + (Math.random() * 79999).toInt())
      val newBooking = Booking(
        id = bookingId,
        requestId = req.id,
        customerId = req.customerId,
        customerName = req.customerName,
        customerPhone = req.customerPhone,
        providerId = prov.id,
        providerName = prov.name,
        providerPhone = prov.phone,
        providerRating = prov.rating,
        categoryId = req.categoryId,
        serviceId = req.serviceId,
        serviceName = req.serviceName,
        address = req.address,
        customerLat = req.latitude,
        customerLng = req.longitude,
        providerLat = prov.latitude,
        providerLng = prov.longitude,
        urgency = req.urgency,
        status = BookingStatus.PROVIDER_ASSIGNED,
        otp = otpCode,
        basePrice = basePrice,
        extraCharges = 0.0,
        totalAmount = basePrice,
        platformCommission = platformCommission,
        providerEarnings = providerEarnings,
        paymentMethod = req.paymentPreference,
        paymentStatus = PaymentStatus.PENDING,
        createdAt = System.currentTimeMillis(),
        etaMinutes = 12
      )

      // Update provider to BUSY
      _providers.value = _providers.value.map {
        if (it.id == prov.id) it.copy(availability = ProviderAvailability.BUSY, activeBookingId = bookingId)
        else it
      }

      // Update request status to ASSIGNED
      val updatedReq = req.copy(
        status = BookingStatus.PROVIDER_ASSIGNED,
        assignedProviderId = prov.id,
        offeredToProviderId = null
      )
      updateRequest(updatedReq)

      // Add to bookings
      _bookings.value = listOf(newBooking) + _bookings.value

      // Notify customer
      postNotification(
        UserRole.CUSTOMER,
        "Provider Assigned: ${prov.name}!",
        "${prov.name} (${prov.rating}★) has accepted your service request. Reaching in ~12 mins.",
        bookingId
      )

      // Notify admin
      postNotification(
        UserRole.ADMIN,
        "Booking Confirmed: $bookingId",
        "${req.serviceName} assigned to ${prov.name}",
        bookingId
      )

      return true
    }
  }

  // --- Provider Job State Transitions ---
  fun startNavigation(bookingId: String) {
    updateBookingStatus(bookingId, BookingStatus.PROVIDER_ON_THE_WAY)
    postNotification(
      UserRole.CUSTOMER,
      "Provider Is On The Way",
      "Your service partner has started navigation towards your location.",
      bookingId
    )
  }

  fun markArrived(bookingId: String) {
    updateBookingStatus(bookingId, BookingStatus.ARRIVED)
    val booking = _bookings.value.find { it.id == bookingId }
    if (booking != null) {
      postNotification(
        UserRole.CUSTOMER,
        "Provider Has Arrived!",
        "Please verify OTP ${booking.otp} with ${booking.providerName} to start the service.",
        bookingId
      )
    }
  }

  fun verifyOtpAndStartService(bookingId: String, enteredOtp: String): Boolean {
    val booking = _bookings.value.find { it.id == bookingId } ?: return false
    if (booking.otp == enteredOtp.trim()) {
      updateBookingStatus(bookingId, BookingStatus.SERVICE_STARTED)
      postNotification(
        UserRole.CUSTOMER,
        "Service Started",
        "Work in progress by ${booking.providerName}.",
        bookingId
      )
      return true
    }
    return false
  }

  // Admin override to start service without OTP if needed
  fun adminOverrideStartService(bookingId: String) {
    updateBookingStatus(bookingId, BookingStatus.SERVICE_STARTED)
  }

  fun completeService(bookingId: String, extraCharges: Double, reason: String?, notes: String?) {
    val booking = _bookings.value.find { it.id == bookingId } ?: return
    val newTotal = booking.basePrice + extraCharges
    val commission = newTotal * 0.20
    val provEarning = newTotal - commission

    val updated = booking.copy(
      status = BookingStatus.SERVICE_COMPLETED,
      extraCharges = extraCharges,
      extraChargeReason = reason,
      totalAmount = newTotal,
      platformCommission = commission,
      providerEarnings = provEarning,
      completionNotes = notes,
      paymentStatus = PaymentStatus.PENDING
    )
    updateBooking(updated)

    // Free up provider and credit earnings
    _providers.value = _providers.value.map {
      if (it.id == booking.providerId) {
        it.copy(
          availability = ProviderAvailability.ONLINE,
          activeBookingId = null,
          completedJobs = it.completedJobs + 1,
          todayEarnings = it.todayEarnings + provEarning,
          walletBalance = it.walletBalance + provEarning
        )
      } else it
    }

    postNotification(
      UserRole.CUSTOMER,
      "Service Completed! Final Bill: ₹${newTotal.toInt()}",
      "Please review the invoice and complete payment.",
      bookingId
    )
  }

  fun markPaid(bookingId: String, paymentMethod: PaymentMethod) {
    val booking = _bookings.value.find { it.id == bookingId } ?: return
    val updated = booking.copy(
      status = BookingStatus.COMPLETED,
      paymentStatus = PaymentStatus.PAID,
      paymentMethod = paymentMethod
    )
    updateBooking(updated)

    postNotification(
      UserRole.CUSTOMER,
      "Payment Successful! ₹${booking.totalAmount.toInt()}",
      "Thank you for choosing GharSaathi. Please rate your experience.",
      bookingId
    )
    postNotification(
      UserRole.PROVIDER,
      "Payment Received: ₹${booking.totalAmount.toInt()}",
      "Earnings credited to your GharSaathi wallet.",
      bookingId
    )
  }

  fun submitReview(bookingId: String, rating: Int, reviewText: String, tags: List<String>) {
    val booking = _bookings.value.find { it.id == bookingId } ?: return
    val updated = booking.copy(
      customerRating = rating,
      customerReview = reviewText,
      reviewTags = tags
    )
    updateBooking(updated)

    // Update provider average rating
    _providers.value = _providers.value.map { prov ->
      if (prov.id == booking.providerId) {
        val newCount = prov.reviewCount + 1
        val newAvg = ((prov.rating * prov.reviewCount) + rating) / newCount
        prov.copy(rating = (newAvg * 100).roundToInt() / 100.0, reviewCount = newCount)
      } else prov
    }
  }

  // --- Inquiry Handling ---
  fun submitInquiry(serviceCategory: String, queryText: String): Inquiry {
    val cust = _customerProfile.value
    val inq = Inquiry(
      id = "INQ-" + (1000 + (Math.random() * 8999).toInt()),
      customerName = cust.name,
      customerPhone = cust.phone,
      serviceCategory = serviceCategory,
      queryText = queryText,
      status = InquiryStatus.NEW
    )
    _inquiries.value = listOf(inq) + _inquiries.value
    postNotification(
      UserRole.ADMIN,
      "New Customer Inquiry",
      "$serviceCategory: $queryText",
      inq.id
    )
    return inq
  }

  fun quoteInquiry(inquiryId: String, price: Double) {
    _inquiries.value = _inquiries.value.map {
      if (it.id == inquiryId) it.copy(status = InquiryStatus.QUOTED, quotedPrice = price)
      else it
    }
  }

  fun closeInquiry(inquiryId: String) {
    _inquiries.value = _inquiries.value.map {
      if (it.id == inquiryId) it.copy(status = InquiryStatus.CLOSED)
      else it
    }
  }

  // --- Complaint Handling ---
  fun submitComplaint(bookingId: String, providerName: String, subject: String, desc: String) {
    val cust = _customerProfile.value
    val complaint = Complaint(
      id = "CMP-" + (1000 + (Math.random() * 8999).toInt()),
      bookingId = bookingId,
      customerName = cust.name,
      providerName = providerName,
      subject = subject,
      description = desc,
      status = ComplaintStatus.OPEN
    )
    _complaints.value = listOf(complaint) + _complaints.value
    postNotification(
      UserRole.ADMIN,
      "Customer Complaint: $subject",
      "Regarding booking $bookingId. Support number ${SeedData.BUSINESS_PHONE}.",
      complaint.id
    )
  }

  fun resolveComplaint(complaintId: String) {
    _complaints.value = _complaints.value.map {
      if (it.id == complaintId) it.copy(status = ComplaintStatus.RESOLVED)
      else it
    }
  }

  // --- Chat Messages ---
  fun sendChatMessage(bookingId: String, text: String, isProvider: Boolean) {
    val sender = if (isProvider) {
      val prov = _providers.value.find { it.id == _activeProviderId.value }
      prov?.name ?: "Service Provider"
    } else {
      _customerProfile.value.name
    }
    val msg = ChatMessage(
      id = UUID.randomUUID().toString(),
      bookingId = bookingId,
      senderId = if (isProvider) _activeProviderId.value else _customerProfile.value.id,
      senderName = sender,
      isProvider = isProvider,
      text = text
    )
    _chatMessages.value = _chatMessages.value + msg
  }

  // --- Admin Provider Actions ---
  fun toggleProviderKyc(providerId: String) {
    _providers.value = _providers.value.map {
      if (it.id == providerId) it.copy(isKycVerified = !it.isKycVerified)
      else it
    }
  }

  fun addCustomProvider(name: String, phone: String, skills: List<String>, category: String) {
    val newP = ProviderProfile(
      id = "prov_" + (100 + (Math.random() * 899).toInt()),
      name = name,
      phone = phone,
      rating = 5.0,
      reviewCount = 1,
      completedJobs = 0,
      skills = skills,
      categories = listOf(category),
      experienceYears = 3,
      isKycVerified = true,
      availability = ProviderAvailability.ONLINE,
      latitude = 28.5350 + (Math.random() - 0.5) * 0.02,
      longitude = 77.3910 + (Math.random() - 0.5) * 0.02,
      responseRate = 100
    )
    _providers.value = _providers.value + newP
  }

  // --- Helper Methods ---
  private fun updateRequest(req: ServiceRequest) {
    _requests.value = _requests.value.map { if (it.id == req.id) req else it }
  }

  private fun updateBooking(booking: Booking) {
    _bookings.value = _bookings.value.map { if (it.id == booking.id) booking else it }
  }

  private fun updateBookingStatus(bookingId: String, status: BookingStatus) {
    _bookings.value = _bookings.value.map {
      if (it.id == bookingId) it.copy(status = status) else it
    }
  }

  private fun postNotification(role: UserRole, title: String, message: String, bookingId: String? = null) {
    val notif = NotificationItem(
      id = UUID.randomUUID().toString(),
      targetRole = role,
      title = title,
      message = message,
      bookingId = bookingId
    )
    _notifications.value = listOf(notif) + _notifications.value
  }

  private fun calculateDistanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
    val earthRadiusKm = 6371.0
    val dLat = Math.toRadians(lat2 - lat1)
    val dLon = Math.toRadians(lon2 - lon1)
    val a = sin(dLat / 2) * sin(dLat / 2) +
      cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
      sin(dLon / 2) * sin(dLon / 2)
    val c = 2 * atan2(sqrt(a), sqrt(1 - a))
    val dist = earthRadiusKm * c
    return (dist * 10).roundToInt() / 10.0
  }
}
