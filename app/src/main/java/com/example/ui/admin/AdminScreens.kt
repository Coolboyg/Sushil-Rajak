package com.example.ui.admin

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.GharSaathiRepository
import com.example.data.SeedData
import com.example.model.*
import com.example.ui.components.GharSaathiMapCanvas
import com.example.ui.theme.*

@Composable
fun AdminDashboardScreen(onSupportClick: () -> Unit) {
  val providers by GharSaathiRepository.providers.collectAsState()
  val requests by GharSaathiRepository.requests.collectAsState()
  val bookings by GharSaathiRepository.bookings.collectAsState()
  val inquiries by GharSaathiRepository.inquiries.collectAsState()
  val complaints by GharSaathiRepository.complaints.collectAsState()
  val countdowns by GharSaathiRepository.offerCountdowns.collectAsState()

  var selectedTab by remember { mutableStateOf(0) } // 0: Overview & Live, 1: Live Map, 2: Providers, 3: Inquiries & Complaints, 4: Reports
  var showAddProviderDialog by remember { mutableStateOf(false) }

  val activeBookingsCount = bookings.count { it.status != BookingStatus.COMPLETED && it.status != BookingStatus.CANCELLED }
  val activeProvidersCount = providers.count { it.availability == ProviderAvailability.ONLINE }
  val totalGrossRevenue = bookings.filter { it.paymentStatus == PaymentStatus.PAID }.sumOf { it.totalAmount }
  val totalCommission = totalGrossRevenue * 0.20
  val totalProviderPayouts = totalGrossRevenue * 0.80

  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(NeutralBackground)
  ) {
    // Top Tabs Navigation
    ScrollableTabRow(
      selectedTabIndex = selectedTab,
      containerColor = Color.White,
      contentColor = BrandPrimaryNavy,
      edgePadding = 12.dp
    ) {
      Tab(
        selected = selectedTab == 0,
        onClick = { selectedTab = 0 },
        text = { Text("Live Monitor", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
      )
      Tab(
        selected = selectedTab == 1,
        onClick = { selectedTab = 1 },
        text = { Text("Live Map", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
      )
      Tab(
        selected = selectedTab == 2,
        onClick = { selectedTab = 2 },
        text = { Text("Providers (${providers.size})", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
      )
      Tab(
        selected = selectedTab == 3,
        onClick = { selectedTab = 3 },
        text = { Text("Inquiries (${inquiries.size})", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
      )
      Tab(
        selected = selectedTab == 4,
        onClick = { selectedTab = 4 },
        text = { Text("Reports & Finance", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
      )
    }

    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(horizontal = 14.dp, vertical = 10.dp),
      verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
      when (selectedTab) {
        0 -> {
          // --- TAB 0: LIVE OVERVIEW & REQUEST MONITOR ---
          item {
            // Metrics Cards Row
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
              ) {
                AdminMetricCard(
                  title = "Live Requests",
                  value = "${requests.count { it.status == BookingStatus.SEARCHING }}",
                  color = AccentAmber,
                  modifier = Modifier.weight(1f)
                )
                AdminMetricCard(
                  title = "Active Bookings",
                  value = "$activeBookingsCount",
                  color = BrandTealDark,
                  modifier = Modifier.weight(1f)
                )
                AdminMetricCard(
                  title = "Online Partners",
                  value = "$activeProvidersCount",
                  color = BrandPrimaryNavy,
                  modifier = Modifier.weight(1f)
                )
              }
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
              ) {
                AdminMetricCard(
                  title = "Gross Revenue",
                  value = "₹${totalGrossRevenue.toInt()}",
                  color = BrandPrimaryNavy,
                  modifier = Modifier.weight(1f)
                )
                AdminMetricCard(
                  title = "Platform Fee (20%)",
                  value = "₹${totalCommission.toInt()}",
                  color = BrandTealDark,
                  modifier = Modifier.weight(1f)
                )
                AdminMetricCard(
                  title = "Partner Payouts",
                  value = "₹${totalProviderPayouts.toInt()}",
                  color = AccentBlue,
                  modifier = Modifier.weight(1f)
                )
              }
            }
          }

          item {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Text(
                text = "Live Service Requests Dispatch Monitor",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = NeutralDark
              )
              Surface(
                shape = RoundedCornerShape(12.dp),
                color = BrandTealBg
              ) {
                Text(
                  text = "Real-Time 25s Dispatch",
                  fontSize = 10.sp,
                  fontWeight = FontWeight.Bold,
                  color = BrandTealDark,
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
              }
            }
          }

          if (requests.isEmpty()) {
            item {
              Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth()
              ) {
                Column(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                  horizontalAlignment = Alignment.CenterHorizontally
                ) {
                  Icon(Icons.Default.Schedule, contentDescription = null, tint = NeutralMuted, modifier = Modifier.size(36.dp))
                  Spacer(modifier = Modifier.height(8.dp))
                  Text("No incoming requests at the moment.", fontWeight = FontWeight.Bold)
                  Text("Switch to 'Customer' role to place a service request.", fontSize = 11.sp, color = NeutralMuted)
                }
              }
            }
          } else {
            items(requests) { req ->
              val secondsRemaining = countdowns[req.id] ?: 25
              Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder),
                modifier = Modifier.fillMaxWidth()
              ) {
                Column(modifier = Modifier.padding(12.dp)) {
                  Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                  ) {
                    Row(
                      verticalAlignment = Alignment.CenterVertically,
                      horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                      Text(
                        text = req.id,
                        fontWeight = FontWeight.Black,
                        fontSize = 13.sp,
                        color = BrandPrimaryNavy
                      )
                      Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = Color(req.urgency.badgeColorHex).copy(alpha = 0.15f)
                      ) {
                        Text(
                          text = req.urgency.name,
                          fontSize = 9.sp,
                          fontWeight = FontWeight.Bold,
                          color = Color(req.urgency.badgeColorHex),
                          modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                        )
                      }
                    }

                    if (req.status == BookingStatus.SEARCHING && req.offeredToProviderId != null) {
                      Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = AccentRed
                      ) {
                        Text(
                          text = "Timer: ${secondsRemaining}s",
                          color = Color.White,
                          fontSize = 10.sp,
                          fontWeight = FontWeight.Bold,
                          modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                      }
                    } else {
                      Text(
                        text = req.status.displayLabel,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (req.status == BookingStatus.PROVIDER_ASSIGNED) BrandTealDark else NeutralMuted
                      )
                    }
                  }

                  Spacer(modifier = Modifier.height(6.dp))
                  Text(
                    text = req.serviceName,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = NeutralDark
                  )
                  Text(
                    text = "Customer: ${req.customerName} (${req.customerPhone})",
                    fontSize = 11.sp,
                    color = NeutralDark
                  )
                  Text(
                    text = "Address: ${req.address}",
                    fontSize = 11.sp,
                    color = NeutralMuted
                  )
                  Text(
                    text = "Search Radius: ${req.searchRadiusKm} KM • Payment: ${req.paymentPreference.label}",
                    fontSize = 10.sp,
                    color = BrandPrimaryNavy
                  )
                }
              }
            }
          }

          // Active Bookings List
          item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
              text = "Active & Past Bookings (${bookings.size})",
              fontSize = 14.sp,
              fontWeight = FontWeight.Bold,
              color = NeutralDark
            )
          }

          items(bookings) { b ->
            Card(
              shape = RoundedCornerShape(12.dp),
              colors = CardDefaults.cardColors(containerColor = Color.White),
              border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder),
              modifier = Modifier.fillMaxWidth()
            ) {
              Column(modifier = Modifier.padding(12.dp)) {
                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.SpaceBetween
                ) {
                  Text(text = "#${b.id} • ${b.serviceName}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                  Text(
                    text = b.status.displayLabel,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    color = BrandTealDark
                  )
                }
                Text(
                  text = "Partner: ${b.providerName} • Customer: ${b.customerName}",
                  fontSize = 11.sp,
                  color = NeutralMuted
                )
                Text(
                  text = "Amount: ₹${b.totalAmount.toInt()} (Commission 20%: ₹${b.platformCommission.toInt()})",
                  fontSize = 11.sp,
                  fontWeight = FontWeight.SemiBold,
                  color = BrandPrimaryNavy
                )
              }
            }
          }
        }

        1 -> {
          // --- TAB 1: LIVE MAP ---
          item {
            Text("Live Dispatch Map Visualizer", fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text(
              "Displays real-time GPS locations of all customers and registered providers.",
              fontSize = 11.sp,
              color = NeutralMuted
            )
            Spacer(modifier = Modifier.height(8.dp))
            val latestActiveBooking = bookings.firstOrNull {
              it.status != BookingStatus.COMPLETED && it.status != BookingStatus.CANCELLED
            }
            GharSaathiMapCanvas(
              providers = providers,
              activeBooking = latestActiveBooking,
              modifier = Modifier.height(380.dp)
            )
          }

          item {
            Card(
              shape = RoundedCornerShape(12.dp),
              colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
              Column(modifier = Modifier.padding(14.dp)) {
                Text("Map Legend & Concurrency Engine", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Text("🔴 Red Marker: Customer Location (Request Origin)", fontSize = 11.sp)
                Text("🟢 Green Marker: Available Partner (Eligible for instant 25s offer)", fontSize = 11.sp)
                Text("🔵 Blue Marker: Busy Partner (On active booking)", fontSize = 11.sp)
                Text("🟡 Yellow Marker: Partner en route (Simulated GPS navigation active)", fontSize = 11.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                  "Atomic Assignment Guarantee: Backend executes atomic CAS lock on request acceptance to prevent double-booking.",
                  fontSize = 10.sp,
                  color = BrandTealDark,
                  fontWeight = FontWeight.SemiBold
                )
              }
            }
          }
        }

        2 -> {
          // --- TAB 2: PROVIDER MANAGEMENT ---
          item {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Text("Service Partners (${providers.size})", fontSize = 14.sp, fontWeight = FontWeight.Bold)
              Button(
                onClick = { showAddProviderDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                shape = RoundedCornerShape(8.dp)
              ) {
                Text("+ Add Partner", fontSize = 11.sp)
              }
            }
          }

          items(providers) { prov ->
            Card(
              shape = RoundedCornerShape(12.dp),
              colors = CardDefaults.cardColors(containerColor = Color.White),
              border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder),
              modifier = Modifier.fillMaxWidth()
            ) {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
              ) {
                Column(modifier = Modifier.weight(1f)) {
                  Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(prov.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                      shape = RoundedCornerShape(4.dp),
                      color = if (prov.isKycVerified) BrandTealBg else AccentRedBg
                    ) {
                      Text(
                        text = if (prov.isKycVerified) "KYC VERIFIED" else "PENDING",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (prov.isKycVerified) BrandTealDark else AccentRed,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                      )
                    }
                  }
                  Text(prov.skills.joinToString(", "), fontSize = 11.sp, color = NeutralMuted)
                  Text(
                    text = "Phone: ${prov.phone} • Rating: ${prov.rating}★ (${prov.completedJobs} jobs)",
                    fontSize = 11.sp
                  )
                  Text(
                    text = "Earnings: ₹${prov.todayEarnings.toInt()} • Wallet: ₹${prov.walletBalance.toInt()}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandPrimaryNavy
                  )
                }

                Column(horizontalAlignment = Alignment.End) {
                  TextButton(onClick = { GharSaathiRepository.toggleProviderKyc(prov.id) }) {
                    Text(
                      text = if (prov.isKycVerified) "Revoke KYC" else "Approve KYC",
                      fontSize = 10.sp,
                      color = BrandPrimaryNavy
                    )
                  }
                  Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = if (prov.availability == ProviderAvailability.ONLINE) BrandTeal else Color(0xFF94A3B8)
                  ) {
                    Text(
                      text = prov.availability.name,
                      color = Color.White,
                      fontSize = 9.sp,
                      fontWeight = FontWeight.Bold,
                      modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                  }
                }
              }
            }
          }
        }

        3 -> {
          // --- TAB 3: INQUIRIES & COMPLAINTS ---
          item {
            Text("Customer Inquiries ('Ask For Service')", fontSize = 14.sp, fontWeight = FontWeight.Bold)
          }

          items(inquiries) { inq ->
            Card(
              shape = RoundedCornerShape(12.dp),
              colors = CardDefaults.cardColors(containerColor = Color.White),
              border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder),
              modifier = Modifier.fillMaxWidth()
            ) {
              Column(modifier = Modifier.padding(12.dp)) {
                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.SpaceBetween
                ) {
                  Text(text = inq.id, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                  Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = BrandTealBg
                  ) {
                    Text(
                      text = inq.status.label,
                      color = BrandTealDark,
                      fontWeight = FontWeight.Bold,
                      fontSize = 10.sp,
                      modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                  }
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Customer: ${inq.customerName} (${inq.customerPhone})", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Text(text = "\"${inq.queryText}\"", fontSize = 12.sp, color = NeutralDark)
                if (inq.quotedPrice != null) {
                  Text(text = "Quoted Price: ₹${inq.quotedPrice.toInt()}", fontWeight = FontWeight.Bold, color = BrandPrimaryNavy, fontSize = 11.sp)
                }

                Spacer(modifier = Modifier.height(6.dp))
                val context = LocalContext.current
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                  Button(
                    onClick = {
                      val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${inq.customerPhone}"))
                      try { context.startActivity(intent) } catch (_: Exception) {}
                    },
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                    shape = RoundedCornerShape(6.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandPrimaryNavy)
                  ) {
                    Text("Call Customer", fontSize = 10.sp)
                  }
                  if (inq.status == InquiryStatus.NEW) {
                    OutlinedButton(
                      onClick = { GharSaathiRepository.quoteInquiry(inq.id, 499.0) },
                      contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                      shape = RoundedCornerShape(6.dp)
                    ) {
                      Text("Quote ₹499", fontSize = 10.sp)
                    }
                  }
                }
              }
            }
          }

          item {
            Spacer(modifier = Modifier.height(10.dp))
            Text("Customer Complaints & Tickets", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = AccentRed)
          }

          items(complaints) { cmp ->
            Card(
              shape = RoundedCornerShape(12.dp),
              colors = CardDefaults.cardColors(containerColor = Color.White),
              border = androidx.compose.foundation.BorderStroke(1.dp, AccentRed.copy(alpha = 0.4f)),
              modifier = Modifier.fillMaxWidth()
            ) {
              Column(modifier = Modifier.padding(12.dp)) {
                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.SpaceBetween
                ) {
                  Text(text = cmp.subject, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                  Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = if (cmp.status == ComplaintStatus.RESOLVED) BrandTealBg else AccentRedBg
                  ) {
                    Text(
                      text = cmp.status.label,
                      color = if (cmp.status == ComplaintStatus.RESOLVED) BrandTealDark else AccentRed,
                      fontWeight = FontWeight.Bold,
                      fontSize = 10.sp,
                      modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                  }
                }
                Text(text = "Customer: ${cmp.customerName} • Partner: ${cmp.providerName}", fontSize = 11.sp, color = NeutralMuted)
                Text(text = cmp.description, fontSize = 12.sp, modifier = Modifier.padding(vertical = 4.dp))
                if (cmp.status != ComplaintStatus.RESOLVED) {
                  Button(
                    onClick = { GharSaathiRepository.resolveComplaint(cmp.id) },
                    shape = RoundedCornerShape(6.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                  ) {
                    Text("Mark Resolved", fontSize = 10.sp)
                  }
                }
              }
            }
          }
        }

        4 -> {
          // --- TAB 4: REPORTS & FINANCIAL AUDIT ---
          item {
            Card(
              shape = RoundedCornerShape(14.dp),
              colors = CardDefaults.cardColors(containerColor = Color.White),
              border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder),
              modifier = Modifier.fillMaxWidth()
            ) {
              Column(modifier = Modifier.padding(16.dp)) {
                Text("GharSaathi Financial Audit & P&L", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = BrandPrimaryNavy)
                Text("Platform commission rate configured at: 20%", fontSize = 11.sp, color = NeutralMuted)
                Divider(modifier = Modifier.padding(vertical = 10.dp))

                ReportRow("Gross Bookings Revenue", "₹${totalGrossRevenue.toInt()}")
                ReportRow("Platform Commission (20%)", "₹${totalCommission.toInt()}")
                ReportRow("Net Partner Payouts", "₹${totalProviderPayouts.toInt()}")
                ReportRow("Total Completed Bookings", "${bookings.count { it.status == BookingStatus.COMPLETED }}")
                ReportRow("Average Response Time", "18 seconds")
                ReportRow("Customer Satisfaction Score", "4.87 / 5.0")
                ReportRow("Official Support Number", SeedData.BUSINESS_PHONE)

                Spacer(modifier = Modifier.height(14.dp))
                Button(
                  onClick = { /* Export simulation */ },
                  modifier = Modifier.fillMaxWidth(),
                  shape = RoundedCornerShape(10.dp),
                  colors = ButtonDefaults.buttonColors(containerColor = BrandPrimaryNavy)
                ) {
                  Icon(Icons.Default.Download, contentDescription = null)
                  Spacer(modifier = Modifier.width(6.dp))
                  Text("DOWNLOAD REVENUE & AUDIT REPORT (CSV)")
                }
              }
            }
          }
        }
      }
    }
  }

  // Add Custom Provider Dialog
  if (showAddProviderDialog) {
    var provName by remember { mutableStateOf("") }
    var provPhone by remember { mutableStateOf("+91 ") }
    var skillInput by remember { mutableStateOf("Electrician") }

    Dialog(onDismissRequest = { showAddProviderDialog = false }) {
      Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        modifier = Modifier.fillMaxWidth(0.95f)
      ) {
        Column(modifier = Modifier.padding(18.dp)) {
          Text("Register New Service Partner", fontSize = 16.sp, fontWeight = FontWeight.Bold)
          Spacer(modifier = Modifier.height(10.dp))
          OutlinedTextField(value = provName, onValueChange = { provName = it }, label = { Text("Partner Name") }, modifier = Modifier.fillMaxWidth())
          Spacer(modifier = Modifier.height(8.dp))
          OutlinedTextField(value = provPhone, onValueChange = { provPhone = it }, label = { Text("Phone Number") }, modifier = Modifier.fillMaxWidth())
          Spacer(modifier = Modifier.height(8.dp))
          OutlinedTextField(value = skillInput, onValueChange = { skillInput = it }, label = { Text("Primary Skills") }, modifier = Modifier.fillMaxWidth())
          Spacer(modifier = Modifier.height(14.dp))
          Button(
            onClick = {
              if (provName.isNotBlank()) {
                GharSaathiRepository.addCustomProvider(
                  name = provName,
                  phone = provPhone,
                  skills = listOf(skillInput),
                  category = "home_repairs"
                )
                showAddProviderDialog = false
              }
            },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = BrandTeal)
          ) {
            Text("Register Partner")
          }
        }
      }
    }
  }
}

@Composable
private fun AdminMetricCard(title: String, value: String, color: Color, modifier: Modifier = Modifier) {
  Card(
    shape = RoundedCornerShape(10.dp),
    colors = CardDefaults.cardColors(containerColor = Color.White),
    border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder),
    modifier = modifier
  ) {
    Column(
      modifier = Modifier.padding(10.dp),
      horizontalAlignment = Alignment.Start
    ) {
      Text(text = title, fontSize = 10.sp, color = NeutralMuted)
      Spacer(modifier = Modifier.height(2.dp))
      Text(text = value, fontSize = 15.sp, fontWeight = FontWeight.Black, color = color)
    }
  }
}

@Composable
private fun ReportRow(label: String, value: String) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .padding(vertical = 4.dp),
    horizontalArrangement = Arrangement.SpaceBetween
  ) {
    Text(text = label, fontSize = 12.sp, color = NeutralDark)
    Text(text = value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = BrandPrimaryNavy)
  }
}
