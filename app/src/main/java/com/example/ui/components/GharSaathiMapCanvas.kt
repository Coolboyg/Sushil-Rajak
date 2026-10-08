package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.Booking
import com.example.model.BookingStatus
import com.example.model.ProviderAvailability
import com.example.model.ProviderProfile
import com.example.ui.theme.*

@Composable
fun GharSaathiMapCanvas(
  providers: List<ProviderProfile>,
  activeBooking: Booking?,
  customerLat: Double = 28.5350,
  customerLng: Double = 77.3910,
  modifier: Modifier = Modifier,
  onProviderSelected: ((ProviderProfile) -> Unit)? = null
) {
  var selectedMarkerInfo by remember { mutableStateOf<String?>(null) }

  Box(
    modifier = modifier
      .fillMaxWidth()
      .height(230.dp)
      .clip(RoundedCornerShape(16.dp))
      .background(Color(0xFFE8EEF5))
      .border(1.dp, NeutralBorder, RoundedCornerShape(16.dp))
  ) {
    Canvas(
      modifier = Modifier
        .fillMaxSize()
        .pointerInput(providers, activeBooking) {
          detectTapGestures { tapOffset ->
            // Check if tapped near any provider
            val width = size.width
            val height = size.height
            val center = Offset(width / 2f, height / 2f)

            var matched = false
            for (prov in providers) {
              val dx = ((prov.longitude - customerLng) * 12000).toFloat()
              val dy = -((prov.latitude - customerLat) * 12000).toFloat()
              val provPos = Offset(center.x + dx, center.y + dy)
              val dist = (tapOffset - provPos).getDistance()
              if (dist < 40f) {
                selectedMarkerInfo = "${prov.name} (${prov.rating}★) - ${prov.availability.name}"
                onProviderSelected?.invoke(prov)
                matched = true
                break
              }
            }
            if (!matched) {
              val distCust = (tapOffset - center).getDistance()
              if (distCust < 40f) {
                selectedMarkerInfo = "Customer Location (Sector 62, Noida)"
              } else {
                selectedMarkerInfo = null
              }
            }
          }
        }
    ) {
      val canvasWidth = size.width
      val canvasHeight = size.height
      val center = Offset(canvasWidth / 2f, canvasHeight / 2f)

      // Draw background map grid / city blocks
      val roadColor = Color(0xFFD4DEE9)
      val mainRoadColor = Color(0xFFCBD5E1)
      val greenAreaColor = Color(0xFFDCFCE7)

      // City parks
      drawRoundRect(
        color = greenAreaColor,
        topLeft = Offset(canvasWidth * 0.08f, canvasHeight * 0.15f),
        size = androidx.compose.ui.geometry.Size(canvasWidth * 0.25f, canvasHeight * 0.35f),
        cornerRadius = androidx.compose.ui.geometry.CornerRadius(16f, 16f)
      )
      drawRoundRect(
        color = greenAreaColor,
        topLeft = Offset(canvasWidth * 0.65f, canvasHeight * 0.55f),
        size = androidx.compose.ui.geometry.Size(canvasWidth * 0.28f, canvasHeight * 0.32f),
        cornerRadius = androidx.compose.ui.geometry.CornerRadius(16f, 16f)
      )

      // Grid roads
      for (i in 0..5) {
        val y = canvasHeight * (i / 5f)
        drawLine(
          color = roadColor,
          start = Offset(0f, y),
          end = Offset(canvasWidth, y),
          strokeWidth = 3f
        )
      }
      for (i in 0..6) {
        val x = canvasWidth * (i / 6f)
        drawLine(
          color = roadColor,
          start = Offset(x, 0f),
          end = Offset(x, canvasHeight),
          strokeWidth = 3f
        )
      }

      // Main thoroughfare diagonal highway
      drawLine(
        color = mainRoadColor,
        start = Offset(0f, canvasHeight * 0.2f),
        end = Offset(canvasWidth, canvasHeight * 0.85f),
        strokeWidth = 10f
      )

      // If active booking with provider on the way, draw route path
      if (activeBooking != null &&
        (activeBooking.status == BookingStatus.PROVIDER_ON_THE_WAY ||
         activeBooking.status == BookingStatus.PROVIDER_ASSIGNED ||
         activeBooking.status == BookingStatus.ARRIVED)
      ) {
        val provDx = ((activeBooking.providerLng - customerLng) * 12000).toFloat()
        val provDy = -((activeBooking.providerLat - customerLat) * 12000).toFloat()
        val provPos = Offset(center.x + provDx, center.y + provDy)

        // Navigation route (dashed teal line)
        drawLine(
          color = BrandTeal,
          start = provPos,
          end = center,
          strokeWidth = 6f,
          pathEffect = PathEffect.dashPathEffect(floatArrayOf(20f, 12f), 0f)
        )
      }

      // Draw all Provider Markers
      for (prov in providers) {
        val dx = ((prov.longitude - customerLng) * 12000).toFloat()
        val dy = -((prov.latitude - customerLat) * 12000).toFloat()
        val provPos = Offset(center.x + dx, center.y + dy)

        val markerColor = when {
          activeBooking?.providerId == prov.id && activeBooking.status == BookingStatus.PROVIDER_ON_THE_WAY ->
            AccentAmber // YELLOW = On the way
          prov.availability == ProviderAvailability.BUSY ->
            AccentBlue // BLUE = Busy
          prov.availability == ProviderAvailability.ONLINE ->
            BrandTeal // GREEN = Available
          else ->
            NeutralMuted // OFFLINE
        }

        // Outer glow
        drawCircle(
          color = markerColor.copy(alpha = 0.25f),
          radius = 20f,
          center = provPos
        )
        // Main marker circle
        drawCircle(
          color = markerColor,
          radius = 12f,
          center = provPos
        )
        // White center dot
        drawCircle(
          color = Color.White,
          radius = 5f,
          center = provPos
        )
      }

      // Draw Customer Marker at Center (RED Marker with beacon ring)
      drawCircle(
        color = AccentRed.copy(alpha = 0.25f),
        radius = 26f,
        center = center
      )
      drawCircle(
        color = AccentRed,
        radius = 14f,
        center = center
      )
      drawCircle(
        color = Color.White,
        radius = 6f,
        center = center
      )
    }

    // Map Legend Overlay at Top
    Surface(
      shape = RoundedCornerShape(8.dp),
      color = Color.White.copy(alpha = 0.92f),
      shadowElevation = 2.dp,
      modifier = Modifier
        .align(Alignment.TopStart)
        .padding(8.dp)
    ) {
      Row(
        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
      ) {
        LegendItem(color = AccentRed, label = "You / Cust")
        LegendItem(color = BrandTeal, label = "Available")
        LegendItem(color = AccentAmber, label = "On The Way")
        LegendItem(color = AccentBlue, label = "Busy")
      }
    }

    // Selected Marker Toast / Card
    if (selectedMarkerInfo != null) {
      Surface(
        shape = RoundedCornerShape(8.dp),
        color = BrandPrimaryNavy,
        shadowElevation = 4.dp,
        modifier = Modifier
          .align(Alignment.BottomCenter)
          .padding(8.dp)
      ) {
        Text(
          text = selectedMarkerInfo!!,
          color = Color.White,
          fontSize = 11.sp,
          fontWeight = FontWeight.SemiBold,
          modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
      }
    }
  }
}

@Composable
private fun LegendItem(color: Color, label: String) {
  Row(
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(3.dp)
  ) {
    Box(
      modifier = Modifier
        .size(8.dp)
        .clip(CircleShape)
        .background(color)
    )
    Text(
      text = label,
      fontSize = 9.sp,
      fontWeight = FontWeight.Medium,
      color = NeutralDark
    )
  }
}
