package com.example.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.example.model.NotificationItem
import com.example.ui.theme.*

@Composable
fun SupportCenterModal(onDismiss: () -> Unit) {
  val context = LocalContext.current

  Dialog(onDismissRequest = onDismiss) {
    Surface(
      shape = RoundedCornerShape(16.dp),
      color = Color.White,
      modifier = Modifier.fillMaxWidth(0.95f)
    ) {
      Column(modifier = Modifier.padding(20.dp)) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Column {
            Text("GharSaathi Customer Support", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = BrandPrimaryNavy)
            Text(SeedData.BRAND_TAGLINE, fontSize = 11.sp, color = BrandTealDark)
          }
          IconButton(onClick = onDismiss) {
            Icon(Icons.Default.Close, contentDescription = "Close")
          }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Big Call Button
        Card(
          shape = RoundedCornerShape(12.dp),
          colors = CardDefaults.cardColors(containerColor = BrandPrimaryNavy),
          modifier = Modifier
            .fillMaxWidth()
            .clickable {
              val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${SeedData.BUSINESS_PHONE}"))
              try { context.startActivity(intent) } catch (_: Exception) {}
            }
        ) {
          Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
          ) {
            Box(
              modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(BrandTeal),
              contentAlignment = Alignment.Center
            ) {
              Icon(Icons.Default.Phone, contentDescription = null, tint = Color.White)
            }
            Column {
              Text("Official Business Support", color = Color.White, fontSize = 12.sp)
              Text(SeedData.BUSINESS_PHONE, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
              Text("Tap to call toll-free assistance", color = BrandTealLight, fontSize = 10.sp)
            }
          }
        }

        Spacer(modifier = Modifier.height(14.dp))

        Text("Frequently Asked Questions", fontWeight = FontWeight.Bold, fontSize = 13.sp)
        Spacer(modifier = Modifier.height(6.dp))

        FaqItem(
          q = "How does real-time matching work?",
          a = "When you request a service, our algorithm matches nearby online professionals with the right skills within 5 km. The technician receives an instant offer with a 25-second response timer."
        )
        FaqItem(
          q = "What is the OTP verification step?",
          a = "For safety, an exclusive 4-digit code is generated on your screen. The technician must enter this code upon arrival to start your service."
        )
        FaqItem(
          q = "What payment methods are supported?",
          a = "We support UPI (GPay, PhonePe, Paytm), Cards/Net Banking, Cash on Service, and Pay After Service."
        )
      }
    }
  }
}

@Composable
private fun FaqItem(q: String, a: String) {
  Column(modifier = Modifier.padding(vertical = 4.dp)) {
    Text(text = "Q: $q", fontWeight = FontWeight.SemiBold, fontSize = 11.sp, color = NeutralDark)
    Text(text = a, fontSize = 10.sp, color = NeutralMuted, lineHeight = 14.sp)
  }
}

@Composable
fun NotificationCenterModal(onDismiss: () -> Unit) {
  val notifications by GharSaathiRepository.notifications.collectAsState()

  Dialog(onDismissRequest = onDismiss) {
    Surface(
      shape = RoundedCornerShape(16.dp),
      color = Color.White,
      modifier = Modifier
        .fillMaxWidth(0.95f)
        .fillMaxHeight(0.8f)
    ) {
      Column(modifier = Modifier.padding(18.dp)) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
          ) {
            Icon(Icons.Default.Notifications, contentDescription = null, tint = BrandPrimaryNavy)
            Text("Real-Time Dispatch Notifications", fontWeight = FontWeight.Bold, fontSize = 15.sp)
          }
          IconButton(onClick = onDismiss) {
            Icon(Icons.Default.Close, contentDescription = "Close")
          }
        }

        Divider(modifier = Modifier.padding(vertical = 6.dp))

        LazyColumn(
          modifier = Modifier.fillMaxSize(),
          verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          items(notifications) { notif ->
            NotificationCard(notif = notif)
          }
        }
      }
    }
  }
}

@Composable
private fun NotificationCard(notif: NotificationItem) {
  Card(
    shape = RoundedCornerShape(10.dp),
    colors = CardDefaults.cardColors(containerColor = NeutralBackground),
    border = androidx.compose.foundation.BorderStroke(1.dp, NeutralBorder),
    modifier = Modifier.fillMaxWidth()
  ) {
    Row(
      modifier = Modifier.padding(10.dp),
      verticalAlignment = Alignment.Top,
      horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      Surface(
        shape = RoundedCornerShape(4.dp),
        color = when(notif.targetRole) {
          com.example.model.UserRole.CUSTOMER -> BrandPrimaryNavy
          com.example.model.UserRole.PROVIDER -> BrandTealDark
          com.example.model.UserRole.ADMIN -> AccentAmber
        }
      ) {
        Text(
          text = notif.targetRole.name,
          color = Color.White,
          fontSize = 8.sp,
          fontWeight = FontWeight.Bold,
          modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
        )
      }
      Column(modifier = Modifier.weight(1f)) {
        Text(text = notif.title, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = NeutralDark)
        Text(text = notif.message, fontSize = 11.sp, color = NeutralMuted)
      }
    }
  }
}
