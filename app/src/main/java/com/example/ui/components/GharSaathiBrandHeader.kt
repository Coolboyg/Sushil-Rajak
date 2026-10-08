package com.example.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.SeedData
import com.example.model.UserRole
import com.example.ui.theme.*

@Composable
fun GharSaathiLogo(modifier: Modifier = Modifier, size: Int = 36) {
  Box(
    modifier = modifier
      .size(size.dp)
      .clip(RoundedCornerShape((size * 0.28).dp))
      .background(
        Brush.linearGradient(
          colors = listOf(BrandTeal, BrandTealDark)
        )
      ),
    contentAlignment = Alignment.Center
  ) {
    Icon(
      imageVector = Icons.Default.Home,
      contentDescription = "GharSaathi Logo",
      tint = Color.White,
      modifier = Modifier.size((size * 0.65).dp)
    )
  }
}

@Composable
fun GharSaathiBrandHeader(
  currentRole: UserRole,
  onRoleChange: (UserRole) -> Unit,
  onSupportClick: () -> Unit,
  unreadNotifCount: Int = 0,
  onNotifClick: () -> Unit = {}
) {
  val context = LocalContext.current

  Column(
    modifier = Modifier
      .fillMaxWidth()
      .background(BrandPrimaryNavy)
      .padding(horizontal = 16.dp, vertical = 12.dp)
  ) {
    // Top Bar: Brand + Call Support + Notifications
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
      ) {
        GharSaathiLogo(size = 40)
        Column {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
              text = "GHAR",
              color = Color.White,
              fontWeight = FontWeight.Black,
              fontSize = 18.sp,
              letterSpacing = 1.sp
            )
            Text(
              text = "SAATHI",
              color = BrandTealLight,
              fontWeight = FontWeight.Black,
              fontSize = 18.sp,
              letterSpacing = 1.sp
            )
          }
          Text(
            text = SeedData.BRAND_TAGLINE,
            color = Color(0xFFCBD5E1),
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium
          )
        }
      }

      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        // Quick Call Support Button
        Surface(
          shape = RoundedCornerShape(20.dp),
          color = BrandTeal.copy(alpha = 0.2f),
          border = androidx.compose.foundation.BorderStroke(1.dp, BrandTeal.copy(alpha = 0.5f)),
          modifier = Modifier.clickable {
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${SeedData.BUSINESS_PHONE}"))
            try {
              context.startActivity(intent)
            } catch (_: Exception) {
              onSupportClick()
            }
          }
        ) {
          Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
          ) {
            Icon(
              imageVector = Icons.Default.Phone,
              contentDescription = "Call",
              tint = BrandTealLight,
              modifier = Modifier.size(13.dp)
            )
            Text(
              text = SeedData.BUSINESS_PHONE,
              color = Color.White,
              fontSize = 11.sp,
              fontWeight = FontWeight.Bold
            )
          }
        }

        // Notification Icon with Badge
        Box(
          modifier = Modifier
            .size(36.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.1f))
            .clickable { onNotifClick() },
          contentAlignment = Alignment.Center
        ) {
          Icon(
            imageVector = Icons.Default.Notifications,
            contentDescription = "Notifications",
            tint = Color.White,
            modifier = Modifier.size(20.dp)
          )
          if (unreadNotifCount > 0) {
            Box(
              modifier = Modifier
                .align(Alignment.TopEnd)
                .size(14.dp)
                .clip(CircleShape)
                .background(AccentRed),
              contentAlignment = Alignment.Center
            ) {
              Text(
                text = if (unreadNotifCount > 9) "9+" else unreadNotifCount.toString(),
                color = Color.White,
                fontSize = 8.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }
        }
      }
    }

    Spacer(modifier = Modifier.height(12.dp))

    // Interactive Role Switcher Tabs: Customer | Partner | Admin
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .clip(RoundedCornerShape(12.dp))
        .background(BrandNavyDark)
        .padding(3.dp),
      horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
      RoleTabPill(
        title = "Customer",
        subtitle = "ग्राहक",
        icon = Icons.Default.Person,
        isSelected = currentRole == UserRole.CUSTOMER,
        modifier = Modifier.weight(1f),
        onClick = { onRoleChange(UserRole.CUSTOMER) }
      )
      RoleTabPill(
        title = "Partner",
        subtitle = "साथी / कारीगर",
        icon = Icons.Default.Handyman,
        isSelected = currentRole == UserRole.PROVIDER,
        modifier = Modifier.weight(1f),
        onClick = { onRoleChange(UserRole.PROVIDER) }
      )
      RoleTabPill(
        title = "Admin",
        subtitle = "प्रबंधन",
        icon = Icons.Default.Dashboard,
        isSelected = currentRole == UserRole.ADMIN,
        modifier = Modifier.weight(1f),
        onClick = { onRoleChange(UserRole.ADMIN) }
      )
    }
  }
}

@Composable
private fun RoleTabPill(
  title: String,
  subtitle: String,
  icon: androidx.compose.ui.graphics.vector.ImageVector,
  isSelected: Boolean,
  modifier: Modifier = Modifier,
  onClick: () -> Unit
) {
  Box(
    modifier = modifier
      .clip(RoundedCornerShape(9.dp))
      .background(if (isSelected) BrandTeal else Color.Transparent)
      .clickable { onClick() }
      .padding(vertical = 6.dp),
    contentAlignment = Alignment.Center
  ) {
    Row(
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(5.dp)
    ) {
      Icon(
        imageVector = icon,
        contentDescription = title,
        tint = if (isSelected) Color.White else Color(0xFF94A3B8),
        modifier = Modifier.size(15.dp)
      )
      Column(horizontalAlignment = Alignment.Start) {
        Text(
          text = title,
          color = if (isSelected) Color.White else Color(0xFFE2E8F0),
          fontSize = 11.sp,
          fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
        )
        Text(
          text = subtitle,
          color = if (isSelected) Color.White.copy(alpha = 0.8f) else Color(0xFF64748B),
          fontSize = 8.sp,
          fontWeight = FontWeight.Normal
        )
      }
    }
  }
}
