package com.example.model

enum class UserRole {
  CUSTOMER,
  PROVIDER,
  ADMIN
}

enum class UrgencyLevel(val label: String, val badgeColorHex: Long) {
  NORMAL("Normal (Scheduled)", 0xFF2563EB),
  URGENT("Urgent (Within 2 hrs)", 0xFFF59E0B),
  ASAP("ASAP (Immediate 15-30m)", 0xFFEF4444)
}

enum class BookingStatus(val displayLabel: String) {
  REQUESTED("Requested"),
  SEARCHING("Searching Nearby Providers"),
  PROVIDER_ASSIGNED("Provider Assigned"),
  PROVIDER_ON_THE_WAY("Provider On The Way"),
  ARRIVED("Arrived At Location"),
  OTP_PENDING("OTP Verification Pending"),
  SERVICE_STARTED("Service In Progress"),
  SERVICE_COMPLETED("Service Completed"),
  PAYMENT_PENDING("Payment Pending"),
  PAID("Paid"),
  COMPLETED("Completed"),
  CANCELLED("Cancelled"),
  DISPUTED("Disputed")
}

enum class ProviderAvailability {
  ONLINE,
  OFFLINE,
  BUSY
}

enum class PaymentMethod(val label: String) {
  UPI("UPI (GPay / PhonePe / Paytm)"),
  RAZORPAY("Cards / Net Banking (Razorpay)"),
  CASH_ON_SERVICE("Cash on Service"),
  PAY_AFTER_SERVICE("Pay After Service")
}

enum class PaymentStatus {
  PENDING,
  AUTHORIZED,
  PAID,
  FAILED,
  REFUNDED
}

enum class InquiryStatus(val label: String) {
  NEW("New Inquiry"),
  CONTACTED("Contacted"),
  QUOTED("Price Quoted"),
  BOOKED("Converted to Booking"),
  NOT_INTERESTED("Not Interested"),
  CLOSED("Closed")
}

enum class ComplaintStatus(val label: String) {
  OPEN("Open"),
  IN_REVIEW("Under Review"),
  RESOLVED("Resolved")
}

data class ProviderProfile(
  val id: String,
  val name: String,
  val phone: String,
  val rating: Double,
  val reviewCount: Int,
  val completedJobs: Int,
  val skills: List<String>,
  val categories: List<String>,
  val experienceYears: Int,
  val isKycVerified: Boolean,
  val availability: ProviderAvailability,
  val latitude: Double,
  val longitude: Double,
  val responseRate: Int, // e.g. 96 (%)
  val todayEarnings: Double = 0.0,
  val walletBalance: Double = 0.0,
  val activeBookingId: String? = null
)

data class CustomerProfile(
  val id: String,
  val name: String,
  val phone: String,
  val email: String? = null,
  val address: String,
  val latitude: Double,
  val longitude: Double
)

data class ServiceCategory(
  val id: String,
  val name: String,
  val hindiName: String,
  val iconName: String,
  val description: String,
  val servicesCount: Int
)

data class HomeService(
  val id: String,
  val categoryId: String,
  val name: String,
  val hindiName: String,
  val description: String,
  val basePrice: Double,
  val estimatedDuration: String,
  val warrantyDays: Int,
  val inclusions: List<String>,
  val rating: Double,
  val totalBookings: Int,
  val iconName: String
)

data class ServiceRequest(
  val id: String,
  val customerId: String,
  val customerName: String,
  val customerPhone: String,
  val categoryId: String,
  val serviceId: String,
  val serviceName: String,
  val description: String,
  val address: String,
  val latitude: Double,
  val longitude: Double,
  val urgency: UrgencyLevel,
  val preferredDate: String,
  val preferredTime: String,
  val paymentPreference: PaymentMethod,
  val status: BookingStatus,
  val createdAt: Long = System.currentTimeMillis(),
  val searchRadiusKm: Double = 5.0,
  val offeredToProviderId: String? = null,
  val offerExpiresAtMillis: Long = 0L,
  val assignedProviderId: String? = null
)

data class Booking(
  val id: String,
  val requestId: String,
  val customerId: String,
  val customerName: String,
  val customerPhone: String,
  val providerId: String,
  val providerName: String,
  val providerPhone: String,
  val providerRating: Double,
  val categoryId: String,
  val serviceId: String,
  val serviceName: String,
  val address: String,
  val customerLat: Double,
  val customerLng: Double,
  val providerLat: Double,
  val providerLng: Double,
  val urgency: UrgencyLevel,
  val status: BookingStatus,
  val otp: String,
  val basePrice: Double,
  val extraCharges: Double = 0.0,
  val extraChargeReason: String? = null,
  val totalAmount: Double,
  val platformCommission: Double, // 20%
  val providerEarnings: Double,   // 80% + extras
  val paymentMethod: PaymentMethod,
  val paymentStatus: PaymentStatus,
  val customerRating: Int? = null,
  val customerReview: String? = null,
  val reviewTags: List<String> = emptyList(),
  val completionNotes: String? = null,
  val createdAt: Long = System.currentTimeMillis(),
  val etaMinutes: Int = 12
)

data class Inquiry(
  val id: String,
  val customerName: String,
  val customerPhone: String,
  val serviceCategory: String,
  val queryText: String,
  val status: InquiryStatus,
  val quotedPrice: Double? = null,
  val createdAt: Long = System.currentTimeMillis()
)

data class Complaint(
  val id: String,
  val bookingId: String,
  val customerName: String,
  val providerName: String,
  val subject: String,
  val description: String,
  val status: ComplaintStatus,
  val createdAt: Long = System.currentTimeMillis()
)

data class Coupon(
  val code: String,
  val title: String,
  val discountPercent: Int,
  val maxDiscount: Double,
  val minBookingAmount: Double,
  val description: String
)

data class ChatMessage(
  val id: String,
  val bookingId: String,
  val senderId: String,
  val senderName: String,
  val isProvider: Boolean,
  val text: String,
  val timestamp: Long = System.currentTimeMillis()
)

data class NotificationItem(
  val id: String,
  val targetRole: UserRole,
  val title: String,
  val message: String,
  val timestamp: Long = System.currentTimeMillis(),
  val bookingId: String? = null
)
