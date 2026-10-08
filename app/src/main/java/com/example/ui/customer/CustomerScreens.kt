package com.example.ui.customer

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.GharSaathiRepository
import com.example.data.SeedData
import com.example.model.*
import com.example.ui.components.GharSaathiMapCanvas
import com.example.ui.theme.*

@Composable
fun CustomerHomeScreen(
  onSupportClick: () -> Unit,
  onOpenBookings: () -> Unit
) {
  val customer by GharSaathiRepository.customerProfile.collectAsState()
  val providers by GharSaathiRepository.providers.collectAsState()
  val activeRequests by GharSaathiRepository.requests.collectAsState()
  val activeBookings by GharSaathiRepository.bookings.collectAsState()

  var searchQuery by remember { mutableStateOf("") }
  var selectedCategory by remember { mutableStateOf<String?>(null) }
  var serviceToView by remember { mutableStateOf<HomeService?>(null) }
  var serviceToBook by remember { mutableStateOf<HomeService?>(null) }
  var trackingBookingId by remember { mutableStateOf<String?>(null) }
  var showInquiryDialog by remember { mutableStateOf(false) }
  var showAddressEditDialog by remember { mutableStateOf(false) }

  // Check if there is an ongoing request or booking
  val latestActiveBooking = activeBookings.firstOrNull {
    it.status != BookingStatus.COMPLETED && it.status != BookingStatus.CANCELLED
  }
  val latestSearchingReq = activeRequests.firstOrNull {
    it.status == BookingStatus.SEARCHING
  }

  val filteredServices = remember(searchQuery, selectedCategory) {
    var list = SeedData.services
    if (selectedCategory != null) {
      list = list.filter { it.categoryId == selectedCategory }
    }
    if (searchQuery.isNotBlank()) {
      list = list.filter {
        it.name.contains(searchQuery, ignoreCase = true) ||
        it.hindiName.contains(searchQuery, ignoreCase = true) ||
        it.description.contains(searchQuery, ignoreCase = true)
      }
    }
    list
  }

  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(NeutralBackground)
  ) {
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .weight(1f),
      contentPadding = PaddingValues(bottom = 24.dp)
    ) {
      // 1. Location Bar
      item {
        LocationBar(
          address = customer.address,
          onEditClick = { showAddressEditDialog = true }
        )
      }

      // 2. Active Request / Live Tracker Notification Card
      if (latestSearchingReq != null || latestActiveBooking != null) {
        item {
          ActiveJobBanner(
            searchingReq = latestSearchingReq,
            activeBooking = latestActiveBooking,
            onClick = {
              if (latestActiveBooking != null) {
                trackingBookingId = latestActiveBooking.id
              }
            }
          )
        }
      }

      // 3. Search Bar: "आपको किस service की जरूरत है?"
      item {
        SearchSection(
          query = searchQuery,
          onQueryChange = { searchQuery = it }
        )
      }

      // 4. Emergency Service Callout
      item {
        EmergencyCalloutBanner(onCallClick = onSupportClick)
      }

      // 5. Category Chips Horizontal Bar
      item {
        CategoryTabs(
          categories = SeedData.categories,
          selectedCategoryId = selectedCategory,
          onSelectCategory = {
            selectedCategory = if (selectedCategory == it) null else it
          }
        )
      }

      // 6. Section Header: Popular Services
      item {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(
            text = if (selectedCategory != null) "Services in Category" else "Popular Services (लोकप्रिय सेवाएँ)",
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = NeutralDark
          )
          Text(
            text = "${filteredServices.size} available",
            fontSize = 12.sp,
            color = NeutralMuted
          )
        }
      }

      // 7. Services List / Cards
      items(filteredServices) { service ->
        ServiceCardItem(
          service = service,
          onViewDetails = { serviceToView = service },
          onBookNow = { serviceToBook = service }
        )
      }

      // 8. Offers & Coupons Section
      item {
        OffersSection(coupons = GharSaathiRepository.coupons)
      }

      // 9. "Ask For Service" / Inquiry Box
      item {
        InquiryPromptCard(onClick = { showInquiryDialog = true })
      }

      // 10. Business Trust & Support Footer
      item {
        TrustFooter(onSupportClick = onSupportClick)
      }
    }
  }

  // Dialogs & Sheets
  if (serviceToView != null) {
    ServiceDetailDialog(
      service = serviceToView!!,
      providers = providers,
      onDismiss = { serviceToView = null },
      onBookNow = {
        val s = serviceToView!!
        serviceToView = null
        serviceToBook = s
      },
      onAskInquiry = {
        serviceToView = null
        showInquiryDialog = true
      }
    )
  }

  if (serviceToBook != null) {
    ServiceRequestDialog(
      service = serviceToBook!!,
      onDismiss = { serviceToBook = null },
      onRequestSubmitted = { req ->
        serviceToBook = null
        // Show live tracking if already assigned or searching
      }
    )
  }

  if (trackingBookingId != null) {
    val b = activeBookings.find { it.id == trackingBookingId }
    if (b != null) {
      CustomerTrackingDialog(
        booking = b,
        onDismiss = { trackingBookingId = null }
      )
    }
  }

  if (showInquiryDialog) {
    CustomerInquiryDialog(onDismiss = { showInquiryDialog = false })
  }

  if (showAddressEditDialog) {
    EditAddressDialog(
      currentAddress = customer.address,
      onDismiss = { showAddressEditDialog = false },
      onSave = { newAddress ->
        GharSaathiRepository.updateCustomerAddress(newAddress, 28.5350, 77.3910)
        showAddressEditDialog = false
      }
    )
  }
}

@Composable
private fun LocationBar(address: String, onEditClick: () -> Unit) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .background(Color.White)
      .padding(horizontal = 16.dp, vertical = 10.dp),
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.SpaceBetween
  ) {
    Row(
      modifier = Modifier.weight(1f),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      Box(
        modifier = Modifier
          .size(32.dp)
          .clip(CircleShape)
          .background(BrandTealBg),
        contentAlignment = Alignment.Center
      ) {
        Icon(
          imageVector = Icons.Default.LocationOn,
          contentDescription = "Location",
          tint = BrandTealDark,
          modifier = Modifier.size(18.dp)
        )
      }
      Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Text(
            text = "Your Service Location",
            fontSize = 11.sp,
            color = NeutralMuted,
            fontWeight = FontWeight.Medium
          )
          Icon(
            imageVector = Icons.Default.KeyboardArrowDown,
            contentDescription = null,
            tint = NeutralMuted,
            modifier = Modifier.size(16.dp)
          )
        }
        Text(
          text = address,
          fontSize = 12.sp,
          color = NeutralDark,
          fontWeight = FontWeight.SemiBold,
          maxLines = 1
        )
      }
    }

    TextButton(onClick = onEditClick) {
      Text("Change", color = BrandPrimaryNavy, fontWeight = FontWeight.Bold, fontSize = 12.sp)
    }
  }
}

@Composable
private fun ActiveJobBanner(
  searchingReq: ServiceRequest?,
  activeBooking: Booking?,
  onClick: () -> Unit
) {
  val countdowns by GharSaathiRepository.offerCountdowns.collectAsState()
  val remaining = if (searchingReq != null) countdowns[searchingReq.id] ?: 25 else 0

  Card(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp, vertical = 8.dp)
      .clickable { onClick() },
    shape = RoundedCornerShape(12.dp),
    colors = CardDefaults.cardColors(
      containerColor = if (activeBooking != null) BrandPrimaryNavy else Color(0xFF1E293B)
    )
  ) {
    Row(
      modifier = Modifier.padding(14.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.SpaceBetween
    ) {
      Row(
        modifier = Modifier.weight(1f),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
      ) {
        Box(
          modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(BrandTeal),
          contentAlignment = Alignment.Center
        ) {
          Icon(
            imageVector = if (activeBooking != null) Icons.Default.Handyman else Icons.Default.Search,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(20.dp)
          )
        }
        Column {
          Text(
            text = if (activeBooking != null)
              "${activeBooking.serviceName} • ${activeBooking.status.displayLabel}"
            else
              "Searching Nearby Technicians (25s Dispatch)",
            color = Color.White,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold
          )
          Text(
            text = if (activeBooking != null)
              "Technician: ${activeBooking.providerName} (ETA ~${activeBooking.etaMinutes}m)"
            else
              "Matching best provider... $remaining s remaining on offer",
            color = BrandTealLight,
            fontSize = 11.sp
          )
        }
      }

      Surface(
        shape = RoundedCornerShape(16.dp),
        color = BrandTeal
      ) {
        Text(
          text = if (activeBooking != null) "View Live" else "Tracking",
          color = Color.White,
          fontSize = 11.sp,
          fontWeight = FontWeight.Bold,
          modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
        )
      }
    }
  }
}

@Composable
private fun SearchSection(query: String, onQueryChange: (String) -> Unit) {
  Box(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp, vertical = 8.dp)
  ) {
    OutlinedTextField(
      value = query,
      onValueChange = onQueryChange,
      modifier = Modifier.fillMaxWidth(),
      placeholder = {
        Text(
          text = "आपको किस service की जरूरत है? (AC, Plumber, Electrician...)",
          fontSize = 12.sp,
          color = NeutralMuted
        )
      },
      leadingIcon = {
        Icon(
          imageVector = Icons.Default.Search,
          contentDescription = "Search",
          tint = BrandTealDark
        )
      },
      trailingIcon = {
        if (query.isNotEmpty()) {
          IconButton(onClick = { onQueryChange("") }) {
            Icon(Icons.Default.Close, contentDescription = "Clear", tint = NeutralMuted)
          }
        }
      },
      shape = RoundedCornerShape(12.dp),
      colors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = BrandTeal,
        unfocusedBorderColor = NeutralBorder,
        focusedContainerColor = Color.White,
        unfocusedContainerColor = Color.White
      ),
      singleLine = true
    )
  }
}

@Composable
private fun EmergencyCalloutBanner(onCallClick: () -> Unit) {
  Card(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp, vertical = 6.dp),
    shape = RoundedCornerShape(12.dp),
    colors = CardDefaults.cardColors(containerColor = AccentAmberBg),
    border = androidx.compose.foundation.BorderStroke(1.dp, AccentAmber.copy(alpha = 0.5f))
  ) {
    Row(
      modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.SpaceBetween
    ) {
      Row(
        modifier = Modifier.weight(1f),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
      ) {
        Icon(
          imageVector = Icons.Default.Warning,
          contentDescription = "Urgent",
          tint = AccentAmber,
          modifier = Modifier.size(24.dp)
        )
        Column {
          Text(
            text = "Emergency Service Needed?",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF92400E)
          )
          Text(
            text = "Water leakage, short circuit or AC breakdown? Fast priority response.",
            fontSize = 10.sp,
            color = Color(0xFFB45309)
          )
        }
      }

      Button(
        onClick = onCallClick,
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFB45309)),
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
        shape = RoundedCornerShape(8.dp)
      ) {
        Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(12.dp))
        Spacer(modifier = Modifier.width(4.dp))
        Text("Call Now", fontSize = 11.sp, fontWeight = FontWeight.Bold)
      }
    }
  }
}

@Composable
private fun CategoryTabs(
  categories: List<ServiceCategory>,
  selectedCategoryId: String?,
  onSelectCategory: (String) -> Unit
) {
  LazyRow(
    modifier = Modifier
      .fillMaxWidth()
      .padding(vertical = 6.dp),
    contentPadding = PaddingValues(horizontal = 16.dp),
    horizontalArrangement = Arrangement.spacedBy(8.dp)
  ) {
    items(categories) { cat ->
      val isSelected = cat.id == selectedCategoryId
      Surface(
        shape = RoundedCornerShape(20.dp),
        color = if (isSelected) BrandPrimaryNavy else Color.White,
        border = androidx.compose.foundation.BorderStroke(
          1.dp,
          if (isSelected) BrandPrimaryNavy else NeutralBorder
        ),
        modifier = Modifier.clickable { onSelectCategory(cat.id) }
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Text(
            text = cat.name,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) Color.White else NeutralDark
          )
        }
      }
    }
  }
}

@Composable
private fun ServiceCardItem(
  service: HomeService,
  onViewDetails: () -> Unit,
  onBookNow: () -> Unit
) {
  Card(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp, vertical = 5.dp)
      .clickable { onViewDetails() },
    shape = RoundedCornerShape(12.dp),
    colors = CardDefaults.cardColors(containerColor = Color.White),
    border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder)
  ) {
    Row(
      modifier = Modifier.padding(14.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.SpaceBetween
    ) {
      Column(modifier = Modifier.weight(1f)) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Text(
            text = service.name,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = NeutralDark
          )
        }
        Text(
          text = service.hindiName,
          fontSize = 11.sp,
          color = BrandTealDark,
          fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
          text = service.description,
          fontSize = 11.sp,
          color = NeutralMuted,
          maxLines = 2
        )
        Spacer(modifier = Modifier.height(6.dp))

        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
              imageVector = Icons.Default.Star,
              contentDescription = null,
              tint = AccentAmber,
              modifier = Modifier.size(13.dp)
            )
            Spacer(modifier = Modifier.width(2.dp))
            Text(
              text = "${service.rating} (${service.totalBookings}+)",
              fontSize = 11.sp,
              fontWeight = FontWeight.SemiBold,
              color = NeutralDark
            )
          }

          Text(
            text = "• ${service.estimatedDuration}",
            fontSize = 11.sp,
            color = NeutralMuted
          )
          Text(
            text = "• ${service.warrantyDays}d warranty",
            fontSize = 11.sp,
            color = BrandTealDark,
            fontWeight = FontWeight.Medium
          )
        }
      }

      Spacer(modifier = Modifier.width(12.dp))

      Column(
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(6.dp)
      ) {
        Column(horizontalAlignment = Alignment.End) {
          Text(
            text = "Starts at",
            fontSize = 10.sp,
            color = NeutralMuted
          )
          Text(
            text = "₹${service.basePrice.toInt()}",
            fontSize = 16.sp,
            fontWeight = FontWeight.Black,
            color = BrandPrimaryNavy
          )
        }

        Button(
          onClick = onBookNow,
          shape = RoundedCornerShape(8.dp),
          colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
          contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
        ) {
          Text("Book", fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
      }
    }
  }
}

@Composable
private fun OffersSection(coupons: List<Coupon>) {
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .padding(vertical = 12.dp)
  ) {
    Text(
      text = "Offers & Discounts",
      fontSize = 15.sp,
      fontWeight = FontWeight.Bold,
      color = NeutralDark,
      modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
    )

    LazyRow(
      contentPadding = PaddingValues(horizontal = 16.dp),
      horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      items(coupons) { coupon ->
        Card(
          shape = RoundedCornerShape(12.dp),
          colors = CardDefaults.cardColors(containerColor = BrandTealBg),
          border = androidx.compose.foundation.BorderStroke(1.dp, BrandTeal.copy(alpha = 0.4f)),
          modifier = Modifier.width(240.dp)
        ) {
          Column(modifier = Modifier.padding(12.dp)) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Surface(
                shape = RoundedCornerShape(4.dp),
                color = BrandTealDark
              ) {
                Text(
                  text = coupon.code,
                  color = Color.White,
                  fontSize = 11.sp,
                  fontWeight = FontWeight.Black,
                  modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
              }
              Text(
                text = "${coupon.discountPercent}% OFF",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = BrandTealDark
              )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
              text = coupon.title,
              fontSize = 13.sp,
              fontWeight = FontWeight.Bold,
              color = NeutralDark
            )
            Text(
              text = coupon.description,
              fontSize = 10.sp,
              color = NeutralMuted
            )
          }
        }
      }
    }
  }
}

@Composable
private fun InquiryPromptCard(onClick: () -> Unit) {
  Card(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp, vertical = 8.dp)
      .clickable { onClick() },
    shape = RoundedCornerShape(14.dp),
    colors = CardDefaults.cardColors(containerColor = BrandNavyDark)
  ) {
    Row(
      modifier = Modifier.padding(16.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.SpaceBetween
    ) {
      Row(
        modifier = Modifier.weight(1f),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        Box(
          modifier = Modifier
            .size(44.dp)
            .clip(CircleShape)
            .background(BrandTeal.copy(alpha = 0.2f)),
          contentAlignment = Alignment.Center
        ) {
          Icon(
            imageVector = Icons.Default.HelpOutline,
            contentDescription = null,
            tint = BrandTealLight,
            modifier = Modifier.size(24.dp)
          )
        }
        Column {
          Text(
            text = "Ask for Custom Service",
            color = Color.White,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
          )
          Text(
            text = "Need a specific technician or price quote? Ask GharSaathi directly.",
            color = Color(0xFF94A3B8),
            fontSize = 11.sp
          )
        }
      }

      Icon(
        imageVector = Icons.Default.ArrowForward,
        contentDescription = "Open",
        tint = BrandTealLight
      )
    }
  }
}

@Composable
private fun TrustFooter(onSupportClick: () -> Unit) {
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp, vertical = 12.dp),
    horizontalAlignment = Alignment.CenterHorizontally
  ) {
    Text(
      text = "GharSaathi • ${SeedData.BRAND_TAGLINE}",
      fontSize = 11.sp,
      fontWeight = FontWeight.Medium,
      color = NeutralMuted
    )
    Spacer(modifier = Modifier.height(2.dp))
    Text(
      text = "Need Help? Official Business Support: ${SeedData.BUSINESS_PHONE}",
      fontSize = 11.sp,
      fontWeight = FontWeight.Bold,
      color = BrandPrimaryNavy,
      modifier = Modifier.clickable { onSupportClick() }
    )
    Spacer(modifier = Modifier.height(4.dp))
    Text(
      text = "100% Verified Partners • Up to 30 Days Warranty • Transparent Pricing",
      fontSize = 9.sp,
      color = NeutralMuted,
      textAlign = TextAlign.Center
    )
  }
}

// --- Service Detail Dialog ---
@Composable
fun ServiceDetailDialog(
  service: HomeService,
  providers: List<ProviderProfile>,
  onDismiss: () -> Unit,
  onBookNow: () -> Unit,
  onAskInquiry: () -> Unit
) {
  val matchingProviders = providers.filter {
    it.skills.any { skill ->
      service.name.contains(skill, ignoreCase = true) || skill.contains(service.name, ignoreCase = true)
    } || it.categories.contains(service.categoryId)
  }

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false)
  ) {
    Surface(
      modifier = Modifier
        .fillMaxWidth(0.95f)
        .fillMaxHeight(0.85f),
      shape = RoundedCornerShape(16.dp),
      color = Color.White
    ) {
      Column(
        modifier = Modifier
          .fillMaxSize()
          .padding(20.dp)
      ) {
        // Header
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.Top
        ) {
          Column(modifier = Modifier.weight(1f)) {
            Text(
              text = service.name,
              fontSize = 18.sp,
              fontWeight = FontWeight.Bold,
              color = BrandPrimaryNavy
            )
            Text(
              text = service.hindiName,
              fontSize = 13.sp,
              color = BrandTealDark,
              fontWeight = FontWeight.SemiBold
            )
          }
          IconButton(onClick = onDismiss) {
            Icon(Icons.Default.Close, contentDescription = "Close")
          }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Column(
          modifier = Modifier
            .weight(1f)
            .verticalScroll(rememberScrollState()),
          verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
          // Key Badges
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            DetailBadge(title = "Price", value = "₹${service.basePrice.toInt()}+")
            DetailBadge(title = "Duration", value = service.estimatedDuration)
            DetailBadge(title = "Warranty", value = "${service.warrantyDays} Days")
            DetailBadge(title = "Rating", value = "${service.rating}★")
          }

          // Description
          Text(
            text = service.description,
            fontSize = 13.sp,
            color = NeutralDark,
            lineHeight = 18.sp
          )

          // What's Included
          Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = NeutralBackground),
            modifier = Modifier.fillMaxWidth()
          ) {
            Column(modifier = Modifier.padding(14.dp)) {
              Text(
                text = "What's Included",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = NeutralDark
              )
              Spacer(modifier = Modifier.height(8.dp))
              service.inclusions.forEach { inc ->
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(8.dp),
                  modifier = Modifier.padding(vertical = 3.dp)
                ) {
                  Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = BrandTealDark,
                    modifier = Modifier.size(16.dp)
                  )
                  Text(text = inc, fontSize = 12.sp, color = NeutralDark)
                }
              }
            }
          }

          // Nearby Verified Technicians
          Column {
            Text(
              text = "Available Verified Professionals Nearby",
              fontSize = 13.sp,
              fontWeight = FontWeight.Bold,
              color = NeutralDark
            )
            Spacer(modifier = Modifier.height(6.dp))
            matchingProviders.take(3).forEach { prov ->
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(vertical = 4.dp)
                  .background(BrandTealBg.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                  .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
              ) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                  Box(
                    modifier = Modifier
                      .size(28.dp)
                      .clip(CircleShape)
                      .background(BrandTeal),
                    contentAlignment = Alignment.Center
                  ) {
                    Text(
                      text = prov.name.take(1),
                      color = Color.White,
                      fontWeight = FontWeight.Bold,
                      fontSize = 12.sp
                    )
                  }
                  Column {
                    Text(
                      text = prov.name,
                      fontSize = 12.sp,
                      fontWeight = FontWeight.Bold,
                      color = NeutralDark
                    )
                    Text(
                      text = "${prov.rating}★ • ${prov.completedJobs} jobs done • ${prov.responseRate}% response",
                      fontSize = 10.sp,
                      color = NeutralMuted
                    )
                  }
                }
                Surface(
                  shape = RoundedCornerShape(4.dp),
                  color = BrandTealLight.copy(alpha = 0.2f)
                ) {
                  Text(
                    text = "ONLINE",
                    fontSize = 9.sp,
                    color = BrandTealDark,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                  )
                }
              }
            }
          }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Action Buttons
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          OutlinedButton(
            onClick = onAskInquiry,
            modifier = Modifier.weight(1f),
            shape = RoundedCornerShape(10.dp)
          ) {
            Text("Ask for Service", fontSize = 12.sp)
          }

          Button(
            onClick = onBookNow,
            modifier = Modifier.weight(1.3f),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = BrandTeal)
          ) {
            Text("Book Now (Instant Dispatch)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
          }
        }
      }
    }
  }
}

@Composable
private fun DetailBadge(title: String, value: String) {
  Surface(
    shape = RoundedCornerShape(8.dp),
    color = NeutralBackground,
    border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder)
  ) {
    Column(
      modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      Text(text = title, fontSize = 9.sp, color = NeutralMuted)
      Text(text = value, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BrandPrimaryNavy)
    }
  }
}

// --- Service Request Form (Create Inquiry / Direct Booking) ---
@Composable
fun ServiceRequestDialog(
  service: HomeService,
  onDismiss: () -> Unit,
  onRequestSubmitted: (ServiceRequest) -> Unit
) {
  var problemDesc by remember { mutableStateOf("") }
  var urgency by remember { mutableStateOf(UrgencyLevel.NORMAL) }
  var preferredDate by remember { mutableStateOf("Today") }
  var preferredTime by remember { mutableStateOf("Immediate / Next 1 hr") }
  var paymentPref by remember { mutableStateOf(PaymentMethod.UPI) }

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false)
  ) {
    Surface(
      modifier = Modifier
        .fillMaxWidth(0.95f)
        .fillMaxHeight(0.88f),
      shape = RoundedCornerShape(16.dp),
      color = Color.White
    ) {
      Column(
        modifier = Modifier
          .fillMaxSize()
          .padding(20.dp)
      ) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Column {
            Text(
              text = "Request ${service.name}",
              fontSize = 16.sp,
              fontWeight = FontWeight.Bold,
              color = BrandPrimaryNavy
            )
            Text(
              text = "Real-time dispatch to nearby verified providers",
              fontSize = 11.sp,
              color = BrandTealDark
            )
          }
          IconButton(onClick = onDismiss) {
            Icon(Icons.Default.Close, contentDescription = "Close")
          }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Column(
          modifier = Modifier
            .weight(1f)
            .verticalScroll(rememberScrollState()),
          verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
          // Urgency Selection
          Text(text = "Service Urgency", fontSize = 13.sp, fontWeight = FontWeight.Bold)
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            UrgencyLevel.values().forEach { lvl ->
              val isSelected = urgency == lvl
              Surface(
                shape = RoundedCornerShape(8.dp),
                color = if (isSelected) BrandPrimaryNavy else NeutralBackground,
                border = androidx.compose.foundation.BorderStroke(
                  1.dp,
                  if (isSelected) BrandPrimaryNavy else NeutralBorder
                ),
                modifier = Modifier
                  .weight(1f)
                  .clickable { urgency = lvl }
              ) {
                Column(
                  modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
                  horizontalAlignment = Alignment.CenterHorizontally
                ) {
                  Text(
                    text = lvl.name,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isSelected) Color.White else NeutralDark
                  )
                  Text(
                    text = when(lvl) {
                      UrgencyLevel.NORMAL -> "Scheduled"
                      UrgencyLevel.URGENT -> "< 2 hours"
                      UrgencyLevel.ASAP -> "Immediate"
                    },
                    fontSize = 9.sp,
                    color = if (isSelected) Color(0xFFCBD5E1) else NeutralMuted
                  )
                }
              }
            }
          }

          // Problem Description
          Column {
            Text(text = "Problem Description", fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedTextField(
              value = problemDesc,
              onValueChange = { problemDesc = it },
              placeholder = { Text("e.g. AC is not cooling properly, making buzzing sound...") },
              modifier = Modifier.fillMaxWidth(),
              shape = RoundedCornerShape(10.dp),
              minLines = 3
            )
          }

          // Payment Preference
          Column {
            Text(text = "Payment Preference", fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(6.dp))
            PaymentMethod.values().forEach { method ->
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .clickable { paymentPref = method }
                  .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
              ) {
                RadioButton(
                  selected = paymentPref == method,
                  onClick = { paymentPref = method }
                )
                Text(text = method.label, fontSize = 12.sp, color = NeutralDark)
              }
            }
          }

          // Price estimate card
          Card(
            shape = RoundedCornerShape(10.dp),
            colors = CardDefaults.cardColors(containerColor = BrandTealBg)
          ) {
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Column {
                Text(text = "Estimated Base Charge", fontSize = 11.sp, color = NeutralMuted)
                Text(text = "₹${service.basePrice.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Black, color = BrandTealDark)
              }
              Text(
                text = "Pay After Inspection/Service",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = BrandPrimaryNavy
              )
            }
          }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Button(
          onClick = {
            val req = GharSaathiRepository.requestService(
              service = service,
              description = problemDesc,
              urgency = urgency,
              preferredDate = preferredDate,
              preferredTime = preferredTime,
              paymentPref = paymentPref
            )
            onRequestSubmitted(req)
          },
          modifier = Modifier.fillMaxWidth(),
          shape = RoundedCornerShape(12.dp),
          colors = ButtonDefaults.buttonColors(containerColor = BrandTeal)
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(vertical = 4.dp)
          ) {
            Icon(Icons.Default.FlashOn, contentDescription = null)
            Text(
              text = "REQUEST SERVICE (START DISPATCH)",
              fontSize = 13.sp,
              fontWeight = FontWeight.Bold
            )
          }
        }
      }
    }
  }
}

// --- Customer Active Tracking Dialog ---
@Composable
fun CustomerTrackingDialog(
  booking: Booking,
  onDismiss: () -> Unit
) {
  val providers by GharSaathiRepository.providers.collectAsState()
  var ratingValue by remember { mutableStateOf(5) }
  var reviewText by remember { mutableStateOf("") }
  var selectedTags by remember { mutableStateOf(listOf("On Time", "Professional")) }
  var showReviewModal by remember { mutableStateOf(false) }
  var showComplaintModal by remember { mutableStateOf(false) }

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false)
  ) {
    Surface(
      modifier = Modifier
        .fillMaxWidth(0.95f)
        .fillMaxHeight(0.92f),
      shape = RoundedCornerShape(16.dp),
      color = Color.White
    ) {
      Column(
        modifier = Modifier
          .fillMaxSize()
          .padding(18.dp)
      ) {
        // Top Header
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Column {
            Text(
              text = "Live Booking #${booking.id}",
              fontSize = 16.sp,
              fontWeight = FontWeight.Bold,
              color = BrandPrimaryNavy
            )
            Text(
              text = booking.serviceName,
              fontSize = 12.sp,
              color = BrandTealDark,
              fontWeight = FontWeight.SemiBold
            )
          }
          IconButton(onClick = onDismiss) {
            Icon(Icons.Default.Close, contentDescription = "Close")
          }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Column(
          modifier = Modifier
            .weight(1f)
            .verticalScroll(rememberScrollState()),
          verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
          // Status Badge Pill
          Surface(
            shape = RoundedCornerShape(20.dp),
            color = when(booking.status) {
              BookingStatus.COMPLETED, BookingStatus.PAID -> BrandTeal
              BookingStatus.PROVIDER_ON_THE_WAY, BookingStatus.ARRIVED -> AccentAmber
              BookingStatus.SERVICE_STARTED -> BrandPrimaryNavy
              else -> Color(0xFF64748B)
            }
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
              Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color.White))
              Text(
                text = booking.status.displayLabel,
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }

          // Live Interactive Map View
          GharSaathiMapCanvas(
            providers = providers,
            activeBooking = booking,
            customerLat = booking.customerLat,
            customerLng = booking.customerLng
          )

          // Provider Profile Card
          Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = NeutralBackground),
            border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder)
          ) {
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.SpaceBetween
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
              ) {
                Box(
                  modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(BrandPrimaryNavy),
                  contentAlignment = Alignment.Center
                ) {
                  Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                  )
                }
                Column {
                  Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                      text = booking.providerName,
                      fontSize = 14.sp,
                      fontWeight = FontWeight.Bold,
                      color = NeutralDark
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                      imageVector = Icons.Default.Verified,
                      contentDescription = "Verified",
                      tint = BrandTealDark,
                      modifier = Modifier.size(14.dp)
                    )
                  }
                  Text(
                    text = "${booking.providerRating}★ Verified Partner",
                    fontSize = 11.sp,
                    color = NeutralMuted
                  )
                }
              }

              val context = LocalContext.current
              Button(
                onClick = {
                  val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${booking.providerPhone}"))
                  try { context.startActivity(intent) } catch (_: Exception) {}
                },
                colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                shape = RoundedCornerShape(8.dp)
              ) {
                Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(13.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Call", fontSize = 11.sp)
              }
            }
          }

          // OTP Card (CRITICAL: Shown to customer so provider can enter it!)
          if (booking.status == BookingStatus.PROVIDER_ASSIGNED ||
              booking.status == BookingStatus.PROVIDER_ON_THE_WAY ||
              booking.status == BookingStatus.ARRIVED ||
              booking.status == BookingStatus.OTP_PENDING) {
            Card(
              shape = RoundedCornerShape(12.dp),
              colors = CardDefaults.cardColors(containerColor = AccentAmberBg),
              border = androidx.compose.foundation.BorderStroke(1.dp, AccentAmber)
            ) {
              Column(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(14.dp),
                horizontalAlignment = Alignment.CenterHorizontally
              ) {
                Text(
                  text = "SERVICE START OTP",
                  fontSize = 11.sp,
                  fontWeight = FontWeight.Bold,
                  color = Color(0xFF92400E)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                  text = booking.otp,
                  fontSize = 28.sp,
                  fontWeight = FontWeight.Black,
                  letterSpacing = 6.sp,
                  color = BrandPrimaryNavy
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                  text = "Share this 4-digit code with ${booking.providerName} when they arrive at your door to begin work.",
                  fontSize = 10.sp,
                  color = Color(0xFFB45309),
                  textAlign = TextAlign.Center
                )
              }
            }
          }

          // Itemized Invoice (when completed)
          if (booking.status == BookingStatus.SERVICE_COMPLETED ||
              booking.status == BookingStatus.PAYMENT_PENDING ||
              booking.status == BookingStatus.PAID ||
              booking.status == BookingStatus.COMPLETED) {
            Card(
              shape = RoundedCornerShape(12.dp),
              colors = CardDefaults.cardColors(containerColor = NeutralBackground),
              modifier = Modifier.fillMaxWidth()
            ) {
              Column(modifier = Modifier.padding(14.dp)) {
                Text(
                  text = "Final Itemized Invoice",
                  fontSize = 13.sp,
                  fontWeight = FontWeight.Bold,
                  color = NeutralDark
                )
                Spacer(modifier = Modifier.height(8.dp))
                InvoiceRow(label = "Base Service Charge", amount = "₹${booking.basePrice.toInt()}")
                if (booking.extraCharges > 0) {
                  InvoiceRow(
                    label = "Extra Parts / Materials (${booking.extraChargeReason ?: "Parts"})",
                    amount = "₹${booking.extraCharges.toInt()}"
                  )
                }
                Divider(modifier = Modifier.padding(vertical = 6.dp))
                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.SpaceBetween
                ) {
                  Text(text = "Total Payable", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                  Text(
                    text = "₹${booking.totalAmount.toInt()}",
                    fontWeight = FontWeight.Black,
                    fontSize = 16.sp,
                    color = BrandPrimaryNavy
                  )
                }
                Text(
                  text = "Payment Status: ${booking.paymentStatus.name}",
                  fontSize = 11.sp,
                  fontWeight = FontWeight.SemiBold,
                  color = if (booking.paymentStatus == PaymentStatus.PAID) BrandTealDark else AccentRed,
                  modifier = Modifier.padding(top = 4.dp)
                )
              }
            }

            // Payment Action Buttons
            if (booking.paymentStatus != PaymentStatus.PAID) {
              Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                  onClick = {
                    GharSaathiRepository.markPaid(booking.id, PaymentMethod.UPI)
                  },
                  modifier = Modifier.fillMaxWidth(),
                  shape = RoundedCornerShape(10.dp),
                  colors = ButtonDefaults.buttonColors(containerColor = BrandTeal)
                ) {
                  Text("PAY ₹${booking.totalAmount.toInt()} VIA UPI", fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                  onClick = {
                    GharSaathiRepository.markPaid(booking.id, PaymentMethod.CASH_ON_SERVICE)
                  },
                  modifier = Modifier.fillMaxWidth(),
                  shape = RoundedCornerShape(10.dp)
                ) {
                  Text("PAID VIA CASH TO PARTNER")
                }
              }
            } else {
              // Rate Service Button
              Button(
                onClick = { showReviewModal = true },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrandPrimaryNavy)
              ) {
                Text(
                  text = if (booking.customerRating != null) "Review Submitted (${booking.customerRating}★)" else "RATE SERVICE & PARTNER",
                  fontWeight = FontWeight.Bold
                )
              }
            }
          }

          // Report a Problem / Support
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            TextButton(onClick = { showComplaintModal = true }) {
              Text("Report an Issue", color = AccentRed, fontSize = 12.sp)
            }
            Text(
              text = "Support: ${SeedData.BUSINESS_PHONE}",
              fontSize = 11.sp,
              color = NeutralMuted
            )
          }
        }
      }
    }
  }

  // Review Dialog
  if (showReviewModal) {
    Dialog(onDismissRequest = { showReviewModal = false }) {
      Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        modifier = Modifier.padding(16.dp)
      ) {
        Column(
          modifier = Modifier.padding(18.dp),
          horizontalAlignment = Alignment.CenterHorizontally
        ) {
          Text("Rate Your Experience", fontSize = 16.sp, fontWeight = FontWeight.Bold)
          Spacer(modifier = Modifier.height(10.dp))
          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            (1..5).forEach { star ->
              Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = if (star <= ratingValue) AccentAmber else NeutralBorder,
                modifier = Modifier
                  .size(32.dp)
                  .clickable { ratingValue = star }
              )
            }
          }
          Spacer(modifier = Modifier.height(12.dp))
          OutlinedTextField(
            value = reviewText,
            onValueChange = { reviewText = it },
            placeholder = { Text("How was the technician's service?") },
            modifier = Modifier.fillMaxWidth()
          )
          Spacer(modifier = Modifier.height(14.dp))
          Button(
            onClick = {
              GharSaathiRepository.submitReview(booking.id, ratingValue, reviewText, selectedTags)
              showReviewModal = false
            },
            colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
            shape = RoundedCornerShape(8.dp)
          ) {
            Text("Submit Review")
          }
        }
      }
    }
  }

  // Complaint Dialog
  if (showComplaintModal) {
    var subject by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }

    Dialog(onDismissRequest = { showComplaintModal = false }) {
      Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        modifier = Modifier.padding(16.dp)
      ) {
        Column(modifier = Modifier.padding(18.dp)) {
          Text("Register a Complaint", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AccentRed)
          Spacer(modifier = Modifier.height(10.dp))
          OutlinedTextField(
            value = subject,
            onValueChange = { subject = it },
            placeholder = { Text("Issue subject...") },
            modifier = Modifier.fillMaxWidth()
          )
          Spacer(modifier = Modifier.height(8.dp))
          OutlinedTextField(
            value = desc,
            onValueChange = { desc = it },
            placeholder = { Text("Explain the problem...") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
          )
          Spacer(modifier = Modifier.height(12.dp))
          Button(
            onClick = {
              GharSaathiRepository.submitComplaint(booking.id, booking.providerName, subject, desc)
              showComplaintModal = false
            },
            colors = ButtonDefaults.buttonColors(containerColor = AccentRed),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth()
          ) {
            Text("Submit Ticket (Call 8435423190)")
          }
        }
      }
    }
  }
}

@Composable
private fun InvoiceRow(label: String, amount: String) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .padding(vertical = 3.dp),
    horizontalArrangement = Arrangement.SpaceBetween
  ) {
    Text(text = label, fontSize = 12.sp, color = NeutralDark)
    Text(text = amount, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = NeutralDark)
  }
}

// --- Customer Inquiry Dialog ---
@Composable
fun CustomerInquiryDialog(onDismiss: () -> Unit) {
  var selectedCategory by remember { mutableStateOf(SeedData.categories.first().name) }
  var queryText by remember { mutableStateOf("") }
  var submitted by remember { mutableStateOf(false) }

  Dialog(onDismissRequest = onDismiss) {
    Surface(
      shape = RoundedCornerShape(16.dp),
      color = Color.White,
      modifier = Modifier.fillMaxWidth(0.95f)
    ) {
      Column(modifier = Modifier.padding(20.dp)) {
        Text("Ask for Service / Inquiry", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = BrandPrimaryNavy)
        Text("Get custom estimates from our verified technicians", fontSize = 11.sp, color = NeutralMuted)
        Spacer(modifier = Modifier.height(12.dp))

        if (!submitted) {
          OutlinedTextField(
            value = queryText,
            onValueChange = { queryText = it },
            placeholder = { Text("e.g. AC gas charging kitne ki hogi? or I need complete bathroom pipe change.") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
          )
          Spacer(modifier = Modifier.height(12.dp))
          Button(
            onClick = {
              if (queryText.isNotBlank()) {
                GharSaathiRepository.submitInquiry(selectedCategory, queryText)
                submitted = true
              }
            },
            colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp)
          ) {
            Text("Submit Inquiry")
          }
        } else {
          Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
          ) {
            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = BrandTeal, modifier = Modifier.size(44.dp))
            Spacer(modifier = Modifier.height(8.dp))
            Text("Inquiry Submitted!", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Text(
              "Our operations team and partner will call you shortly at +91 98765 43210. Support: ${SeedData.BUSINESS_PHONE}",
              fontSize = 11.sp,
              color = NeutralMuted,
              textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(12.dp))
            Button(onClick = onDismiss) { Text("Close") }
          }
        }
      }
    }
  }
}

// --- Edit Address Dialog ---
@Composable
fun EditAddressDialog(
  currentAddress: String,
  onDismiss: () -> Unit,
  onSave: (String) -> Unit
) {
  var addressInput by remember { mutableStateOf(currentAddress) }

  Dialog(onDismissRequest = onDismiss) {
    Surface(
      shape = RoundedCornerShape(16.dp),
      color = Color.White,
      modifier = Modifier.fillMaxWidth(0.95f)
    ) {
      Column(modifier = Modifier.padding(20.dp)) {
        Text("Update Service Address", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
          value = addressInput,
          onValueChange = { addressInput = it },
          modifier = Modifier.fillMaxWidth(),
          minLines = 2
        )
        Spacer(modifier = Modifier.height(12.dp))
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.End
        ) {
          TextButton(onClick = onDismiss) { Text("Cancel") }
          Button(
            onClick = { onSave(addressInput) },
            colors = ButtonDefaults.buttonColors(containerColor = BrandTeal)
          ) {
            Text("Save Address")
          }
        }
      }
    }
  }
}
