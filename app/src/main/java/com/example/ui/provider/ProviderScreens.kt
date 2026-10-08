package com.example.ui.provider

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
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
fun ProviderDashboardScreen(onSupportClick: () -> Unit) {
  val providers by GharSaathiRepository.providers.collectAsState()
  val activeProviderId by GharSaathiRepository.activeProviderId.collectAsState()
  val requests by GharSaathiRepository.requests.collectAsState()
  val bookings by GharSaathiRepository.bookings.collectAsState()
  val countdowns by GharSaathiRepository.offerCountdowns.collectAsState()

  val currentProvider = providers.find { it.id == activeProviderId } ?: providers.first()

  // Find incoming offer for this provider
  val incomingOffer = requests.firstOrNull {
    it.status == BookingStatus.SEARCHING && it.offeredToProviderId == currentProvider.id
  }

  // Find active booking for this provider
  val activeBooking = bookings.firstOrNull {
    it.providerId == currentProvider.id &&
    it.status != BookingStatus.COMPLETED &&
    it.status != BookingStatus.CANCELLED
  }

  var showOtpDialog by remember { mutableStateOf(false) }
  var showAddPartsDialog by remember { mutableStateOf(false) }
  var showChatDialog by remember { mutableStateOf(false) }
  var showProviderSelector by remember { mutableStateOf(false) }

  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(NeutralBackground)
  ) {
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(horizontal = 16.dp, vertical = 10.dp),
      verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
      // 1. Provider Identity Bar & Switcher
      item {
        Card(
          shape = RoundedCornerShape(14.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder)
        ) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(12.dp),
              modifier = Modifier.clickable { showProviderSelector = true }
            ) {
              Box(
                modifier = Modifier
                  .size(46.dp)
                  .clip(CircleShape)
                  .background(BrandPrimaryNavy),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = currentProvider.name.take(1),
                  color = Color.White,
                  fontSize = 18.sp,
                  fontWeight = FontWeight.Bold
                )
              }
              Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                  Text(
                    text = currentProvider.name,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = NeutralDark
                  )
                  Spacer(modifier = Modifier.width(4.dp))
                  Icon(
                    imageVector = Icons.Default.Verified,
                    contentDescription = "KYC Verified",
                    tint = BrandTealDark,
                    modifier = Modifier.size(15.dp)
                  )
                }
                Text(
                  text = "${currentProvider.skills.joinToString(", ")} • Tap to switch",
                  fontSize = 11.sp,
                  color = NeutralMuted
                )
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                  Text(
                    text = "${currentProvider.rating}★ (${currentProvider.reviewCount} reviews)",
                    fontSize = 11.sp,
                    color = AccentAmber,
                    fontWeight = FontWeight.SemiBold
                  )
                  Text(text = "• ${currentProvider.responseRate}% Response", fontSize = 11.sp, color = BrandTealDark)
                }
              }
            }

            // ONLINE / OFFLINE Switch
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
              Switch(
                checked = currentProvider.availability == ProviderAvailability.ONLINE,
                onCheckedChange = {
                  GharSaathiRepository.toggleProviderAvailability(currentProvider.id)
                },
                colors = SwitchDefaults.colors(
                  checkedThumbColor = Color.White,
                  checkedTrackColor = BrandTeal,
                  uncheckedThumbColor = Color.White,
                  uncheckedTrackColor = Color(0xFFCBD5E1)
                )
              )
              Text(
                text = currentProvider.availability.name,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = when (currentProvider.availability) {
                  ProviderAvailability.ONLINE -> BrandTealDark
                  ProviderAvailability.BUSY -> AccentBlue
                  else -> NeutralMuted
                }
              )
            }
          }
        }
      }

      // 2. Incoming Dispatch Alert Banner (If available)
      if (incomingOffer != null) {
        val secondsRemaining = countdowns[incomingOffer.id] ?: 25
        item {
          Card(
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = AccentRedBg),
            border = androidx.compose.foundation.BorderStroke(2.dp, AccentRed)
          ) {
            Column(
              modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
            ) {
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
              ) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                  Icon(
                    imageVector = Icons.Default.NotificationsActive,
                    contentDescription = null,
                    tint = AccentRed
                  )
                  Text(
                    text = "NEW SERVICE REQUEST",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black,
                    color = AccentRed
                  )
                }

                Surface(
                  shape = RoundedCornerShape(12.dp),
                  color = AccentRed
                ) {
                  Text(
                    text = "${secondsRemaining}s remaining",
                    color = Color.White,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                  )
                }
              }

              Spacer(modifier = Modifier.height(10.dp))
              Text(
                text = incomingOffer.serviceName,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = NeutralDark
              )
              Text(
                text = "Customer: ${incomingOffer.customerName} • Distance: ~1.4 KM",
                fontSize = 12.sp,
                color = NeutralDark,
                fontWeight = FontWeight.Medium
              )
              Text(
                text = "Problem: \"${incomingOffer.description}\"",
                fontSize = 12.sp,
                color = NeutralMuted
              )
              Text(
                text = "Estimated Payout: ₹299+ (Urgency: ${incomingOffer.urgency.label})",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = BrandTealDark,
                modifier = Modifier.padding(top = 4.dp)
              )

              Spacer(modifier = Modifier.height(12.dp))

              // ACCEPT / REJECT Buttons
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
              ) {
                OutlinedButton(
                  onClick = {
                    GharSaathiRepository.rejectRequest(incomingOffer.id, currentProvider.id)
                  },
                  modifier = Modifier.weight(1f),
                  shape = RoundedCornerShape(10.dp)
                ) {
                  Text("REJECT", color = AccentRed, fontWeight = FontWeight.Bold)
                }

                Button(
                  onClick = {
                    val success = GharSaathiRepository.acceptRequest(incomingOffer.id, currentProvider.id)
                    // Automatically assigned atomically!
                  },
                  modifier = Modifier.weight(1.5f),
                  shape = RoundedCornerShape(10.dp),
                  colors = ButtonDefaults.buttonColors(containerColor = BrandTeal)
                ) {
                  Text("ACCEPT (${secondsRemaining}s)", fontWeight = FontWeight.Black, fontSize = 14.sp)
                }
              }
            }
          }
        }
      }

      // 3. Current Active Job Card
      if (activeBooking != null) {
        item {
          Card(
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(2.dp, BrandPrimaryNavy)
          ) {
            Column(
              modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
            ) {
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
              ) {
                Text(
                  text = "ACTIVE JOB: #${activeBooking.id}",
                  fontSize = 13.sp,
                  fontWeight = FontWeight.Bold,
                  color = BrandPrimaryNavy
                )
                Surface(
                  shape = RoundedCornerShape(12.dp),
                  color = BrandTeal
                ) {
                  Text(
                    text = activeBooking.status.displayLabel,
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                  )
                }
              }

              Spacer(modifier = Modifier.height(8.dp))
              Text(
                text = activeBooking.serviceName,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = NeutralDark
              )
              Text(
                text = "Customer: ${activeBooking.customerName} (${activeBooking.customerPhone})",
                fontSize = 12.sp,
                color = NeutralDark
              )
              Text(
                text = "Address: ${activeBooking.address}",
                fontSize = 12.sp,
                color = NeutralMuted
              )

              Spacer(modifier = Modifier.height(10.dp))

              // Live Map View for Navigation
              GharSaathiMapCanvas(
                providers = providers,
                activeBooking = activeBooking,
                customerLat = activeBooking.customerLat,
                customerLng = activeBooking.customerLng
              )

              Spacer(modifier = Modifier.height(10.dp))

              // Communication & Navigation Action Row
              val context = LocalContext.current
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
              ) {
                OutlinedButton(
                  onClick = {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${activeBooking.customerPhone}"))
                    try { context.startActivity(intent) } catch (_: Exception) {}
                  },
                  modifier = Modifier.weight(1f),
                  shape = RoundedCornerShape(8.dp)
                ) {
                  Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp))
                  Spacer(modifier = Modifier.width(4.dp))
                  Text("Call", fontSize = 11.sp)
                }

                OutlinedButton(
                  onClick = { showChatDialog = true },
                  modifier = Modifier.weight(1f),
                  shape = RoundedCornerShape(8.dp)
                ) {
                  Icon(Icons.Default.Chat, contentDescription = null, modifier = Modifier.size(14.dp))
                  Spacer(modifier = Modifier.width(4.dp))
                  Text("Chat", fontSize = 11.sp)
                }
              }

              Spacer(modifier = Modifier.height(10.dp))

              // Job Stage Stepper Buttons
              when (activeBooking.status) {
                BookingStatus.PROVIDER_ASSIGNED -> {
                  Button(
                    onClick = { GharSaathiRepository.startNavigation(activeBooking.id) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandPrimaryNavy)
                  ) {
                    Icon(Icons.Default.Navigation, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("START NAVIGATION (ON THE WAY)")
                  }
                }
                BookingStatus.PROVIDER_ON_THE_WAY -> {
                  Button(
                    onClick = { GharSaathiRepository.markArrived(activeBooking.id) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentAmber)
                  ) {
                    Icon(Icons.Default.LocationOn, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("I HAVE ARRIVED AT CUSTOMER DOOR")
                  }
                }
                BookingStatus.ARRIVED, BookingStatus.OTP_PENDING -> {
                  Button(
                    onClick = { showOtpDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandTeal)
                  ) {
                    Icon(Icons.Default.LockOpen, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("ENTER CUSTOMER OTP TO START WORK")
                  }
                }
                BookingStatus.SERVICE_STARTED -> {
                  Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Surface(
                      color = BrandTealBg,
                      shape = RoundedCornerShape(8.dp),
                      modifier = Modifier.fillMaxWidth()
                    ) {
                      Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                      ) {
                        Text(
                          text = "Service in progress... Work active",
                          fontSize = 12.sp,
                          color = BrandTealDark,
                          fontWeight = FontWeight.SemiBold
                        )
                        TextButton(onClick = { showAddPartsDialog = true }) {
                          Text("+ Add Parts / Extras", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                      }
                    }

                    Button(
                      onClick = {
                        GharSaathiRepository.completeService(
                          bookingId = activeBooking.id,
                          extraCharges = activeBooking.extraCharges,
                          reason = activeBooking.extraChargeReason,
                          notes = "Job completed successfully. Customer inspected."
                        )
                      },
                      modifier = Modifier.fillMaxWidth(),
                      shape = RoundedCornerShape(10.dp),
                      colors = ButtonDefaults.buttonColors(containerColor = BrandTeal)
                    ) {
                      Icon(Icons.Default.CheckCircle, contentDescription = null)
                      Spacer(modifier = Modifier.width(6.dp))
                      Text("COMPLETE SERVICE & GENERATE BILL")
                    }
                  }
                }
                BookingStatus.SERVICE_COMPLETED, BookingStatus.PAYMENT_PENDING -> {
                  Surface(
                    color = AccentAmberBg,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                  ) {
                    Text(
                      text = "Bill of ₹${activeBooking.totalAmount.toInt()} generated. Awaiting Customer Payment.",
                      color = Color(0xFF92400E),
                      fontSize = 12.sp,
                      fontWeight = FontWeight.Bold,
                      modifier = Modifier.padding(12.dp)
                    )
                  }
                }
                else -> {}
              }
            }
          }
        }
      }

      // 4. Provider Performance & Earnings Card
      item {
        Card(
          shape = RoundedCornerShape(14.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder)
        ) {
          Column(modifier = Modifier.padding(16.dp)) {
            Text(
              text = "Today's Summary & Wallet",
              fontSize = 14.sp,
              fontWeight = FontWeight.Bold,
              color = NeutralDark
            )
            Spacer(modifier = Modifier.height(10.dp))
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
              MetricBox(
                title = "Today's Earnings",
                value = "₹${currentProvider.todayEarnings.toInt()}",
                modifier = Modifier.weight(1f),
                color = BrandTealDark
              )
              MetricBox(
                title = "Wallet Balance",
                value = "₹${currentProvider.walletBalance.toInt()}",
                modifier = Modifier.weight(1f),
                color = BrandPrimaryNavy
              )
              MetricBox(
                title = "Completed",
                value = "${currentProvider.completedJobs}",
                modifier = Modifier.weight(1f),
                color = AccentAmber
              )
            }
          }
        }
      }

      // 5. Provider Support Callout
      item {
        Card(
          shape = RoundedCornerShape(12.dp),
          colors = CardDefaults.cardColors(containerColor = BrandPrimaryNavy)
        ) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            Column {
              Text("GharSaathi Partner Helpline", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
              Text("24x7 Partner Support: ${SeedData.BUSINESS_PHONE}", color = BrandTealLight, fontSize = 11.sp)
            }
            Button(
              onClick = onSupportClick,
              colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
              shape = RoundedCornerShape(8.dp)
            ) {
              Text("Call")
            }
          }
        }
      }
    }
  }

  // Provider Selection Modal (To test multiple technicians!)
  if (showProviderSelector) {
    Dialog(onDismissRequest = { showProviderSelector = false }) {
      Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        modifier = Modifier.fillMaxWidth(0.95f)
      ) {
        Column(modifier = Modifier.padding(18.dp)) {
          Text("Select Demo Provider Account", fontSize = 16.sp, fontWeight = FontWeight.Bold)
          Text("Switch between verified professionals to test dispatch", fontSize = 11.sp, color = NeutralMuted)
          Spacer(modifier = Modifier.height(12.dp))
          providers.forEach { p ->
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .clickable {
                  GharSaathiRepository.setActiveProvider(p.id)
                  showProviderSelector = false
                }
                .padding(vertical = 8.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.SpaceBetween
            ) {
              Column {
                Text(p.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Text(p.skills.joinToString(", "), fontSize = 10.sp, color = NeutralMuted)
              }
              Surface(
                shape = RoundedCornerShape(4.dp),
                color = if (p.id == currentProvider.id) BrandTeal else NeutralBorder
              ) {
                Text(
                  text = if (p.id == currentProvider.id) "Active" else "Switch",
                  color = if (p.id == currentProvider.id) Color.White else NeutralDark,
                  fontSize = 10.sp,
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
              }
            }
          }
        }
      }
    }
  }

  // OTP Verification Dialog
  if (showOtpDialog && activeBooking != null) {
    var enteredOtp by remember { mutableStateOf("") }
    var isError by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = { showOtpDialog = false }) {
      Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        modifier = Modifier.fillMaxWidth(0.9f)
      ) {
        Column(
          modifier = Modifier.padding(20.dp),
          horizontalAlignment = Alignment.CenterHorizontally
        ) {
          Text("Enter Customer OTP", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = BrandPrimaryNavy)
          Text("Ask the customer for the 4-digit start code", fontSize = 11.sp, color = NeutralMuted)
          Spacer(modifier = Modifier.height(14.dp))
          OutlinedTextField(
            value = enteredOtp,
            onValueChange = {
              if (it.length <= 4) enteredOtp = it
              isError = false
            },
            placeholder = { Text("e.g. 4829") },
            isError = isError,
            singleLine = true,
            modifier = Modifier.fillMaxWidth(0.6f)
          )
          if (isError) {
            Text("Invalid OTP. Please check customer phone.", color = AccentRed, fontSize = 11.sp)
          }
          Spacer(modifier = Modifier.height(16.dp))
          Button(
            onClick = {
              val verified = GharSaathiRepository.verifyOtpAndStartService(activeBooking.id, enteredOtp)
              if (verified) {
                showOtpDialog = false
              } else {
                isError = true
              }
            },
            colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(10.dp)
          ) {
            Text("VERIFY & START SERVICE", fontWeight = FontWeight.Bold)
          }
        }
      }
    }
  }

  // Add Extra Parts Dialog
  if (showAddPartsDialog && activeBooking != null) {
    var extraAmount by remember { mutableStateOf("150") }
    var partsReason by remember { mutableStateOf("Capacitor / Filter Replacement") }

    Dialog(onDismissRequest = { showAddPartsDialog = false }) {
      Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        modifier = Modifier.fillMaxWidth(0.9f)
      ) {
        Column(modifier = Modifier.padding(18.dp)) {
          Text("Add Extra Parts / Material Cost", fontSize = 15.sp, fontWeight = FontWeight.Bold)
          Spacer(modifier = Modifier.height(10.dp))
          OutlinedTextField(
            value = extraAmount,
            onValueChange = { extraAmount = it },
            label = { Text("Amount (₹)") },
            modifier = Modifier.fillMaxWidth()
          )
          Spacer(modifier = Modifier.height(8.dp))
          OutlinedTextField(
            value = partsReason,
            onValueChange = { partsReason = it },
            label = { Text("Description / Reason") },
            modifier = Modifier.fillMaxWidth()
          )
          Spacer(modifier = Modifier.height(12.dp))
          Button(
            onClick = {
              val amt = extraAmount.toDoubleOrNull() ?: 0.0
              GharSaathiRepository.completeService(
                bookingId = activeBooking.id,
                extraCharges = amt,
                reason = partsReason,
                notes = "Spare parts added: $partsReason"
              )
              showAddPartsDialog = false
            },
            colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
            modifier = Modifier.fillMaxWidth()
          ) {
            Text("Save & Add to Bill")
          }
        }
      }
    }
  }

  // Provider In-App Chat Dialog
  if (showChatDialog && activeBooking != null) {
    ProviderChatDialog(
      bookingId = activeBooking.id,
      customerName = activeBooking.customerName,
      onDismiss = { showChatDialog = false }
    )
  }
}

@Composable
private fun MetricBox(title: String, value: String, modifier: Modifier = Modifier, color: Color) {
  Surface(
    shape = RoundedCornerShape(10.dp),
    color = NeutralBackground,
    border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder),
    modifier = modifier
  ) {
    Column(
      modifier = Modifier.padding(10.dp),
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      Text(text = title, fontSize = 10.sp, color = NeutralMuted)
      Spacer(modifier = Modifier.height(2.dp))
      Text(text = value, fontSize = 14.sp, fontWeight = FontWeight.Black, color = color)
    }
  }
}

@Composable
fun ProviderChatDialog(
  bookingId: String,
  customerName: String,
  onDismiss: () -> Unit
) {
  val allMessages by GharSaathiRepository.chatMessages.collectAsState()
  val bookingMessages = allMessages.filter { it.bookingId == bookingId }
  var messageInput by remember { mutableStateOf("") }

  Dialog(onDismissRequest = onDismiss) {
    Surface(
      shape = RoundedCornerShape(16.dp),
      color = Color.White,
      modifier = Modifier
        .fillMaxWidth(0.95f)
        .fillMaxHeight(0.75f)
    ) {
      Column(modifier = Modifier.padding(16.dp)) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text("Chat with $customerName", fontWeight = FontWeight.Bold, fontSize = 15.sp)
          IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = null) }
        }

        Divider(modifier = Modifier.padding(vertical = 6.dp))

        LazyColumn(
          modifier = Modifier
            .weight(1f)
            .fillMaxWidth(),
          verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          if (bookingMessages.isEmpty()) {
            item {
              Text(
                "No messages yet. Send a quick update to the customer.",
                color = NeutralMuted,
                fontSize = 11.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(top = 20.dp)
              )
            }
          }
          items(bookingMessages) { msg ->
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = if (msg.isProvider) Arrangement.End else Arrangement.Start
            ) {
              Surface(
                shape = RoundedCornerShape(8.dp),
                color = if (msg.isProvider) BrandPrimaryNavy else BrandTealBg
              ) {
                Text(
                  text = msg.text,
                  color = if (msg.isProvider) Color.White else NeutralDark,
                  fontSize = 12.sp,
                  modifier = Modifier.padding(8.dp)
                )
              }
            }
          }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(
          modifier = Modifier.fillMaxWidth(),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          OutlinedTextField(
            value = messageInput,
            onValueChange = { messageInput = it },
            placeholder = { Text("Type message...") },
            modifier = Modifier.weight(1f),
            singleLine = true
          )
          Button(
            onClick = {
              if (messageInput.isNotBlank()) {
                GharSaathiRepository.sendChatMessage(bookingId, messageInput, isProvider = true)
                messageInput = ""
              }
            },
            colors = ButtonDefaults.buttonColors(containerColor = BrandTeal)
          ) {
            Icon(Icons.Default.Send, contentDescription = null)
          }
        }
      }
    }
  }
}
