package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.data.GharSaathiRepository
import com.example.model.UserRole
import com.example.ui.admin.AdminDashboardScreen
import com.example.ui.components.GharSaathiBrandHeader
import com.example.ui.components.NotificationCenterModal
import com.example.ui.components.SupportCenterModal
import com.example.ui.customer.CustomerHomeScreen
import com.example.ui.provider.ProviderDashboardScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.NeutralBackground

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        GharSaathiMainApp()
      }
    }
  }
}

@Composable
fun GharSaathiMainApp() {
  val currentRole by GharSaathiRepository.currentRole.collectAsState()
  val notifications by GharSaathiRepository.notifications.collectAsState()

  var showSupportModal by remember { mutableStateOf(false) }
  var showNotifModal by remember { mutableStateOf(false) }

  Scaffold(
    modifier = Modifier
      .fillMaxSize()
      .statusBarsPadding()
      .navigationBarsPadding(),
    topBar = {
      GharSaathiBrandHeader(
        currentRole = currentRole,
        onRoleChange = { GharSaathiRepository.setRole(it) },
        onSupportClick = { showSupportModal = true },
        unreadNotifCount = notifications.size,
        onNotifClick = { showNotifModal = true }
      )
    }
  ) { innerPadding ->
    Box(
      modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding)
        .background(NeutralBackground)
    ) {
      when (currentRole) {
        UserRole.CUSTOMER -> {
          CustomerHomeScreen(
            onSupportClick = { showSupportModal = true },
            onOpenBookings = {}
          )
        }
        UserRole.PROVIDER -> {
          ProviderDashboardScreen(
            onSupportClick = { showSupportModal = true }
          )
        }
        UserRole.ADMIN -> {
          AdminDashboardScreen(
            onSupportClick = { showSupportModal = true }
          )
        }
      }
    }

    if (showSupportModal) {
      SupportCenterModal(onDismiss = { showSupportModal = false })
    }

    if (showNotifModal) {
      NotificationCenterModal(onDismiss = { showNotifModal = false })
    }
  }
}
