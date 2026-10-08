package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme =
  darkColorScheme(
    primary = BrandTeal,
    onPrimary = Color.White,
    primaryContainer = BrandPrimaryNavy,
    onPrimaryContainer = Color.White,
    secondary = BrandTealLight,
    onSecondary = Color.Black,
    background = BrandNavyDark,
    surface = Color(0xFF1E293B),
    onBackground = Color.White,
    onSurface = Color.White,
  )

private val LightColorScheme =
  lightColorScheme(
    primary = BrandPrimaryNavy,
    onPrimary = Color.White,
    primaryContainer = BrandTealBg,
    onPrimaryContainer = BrandTealDark,
    secondary = BrandTeal,
    onSecondary = Color.White,
    tertiary = AccentAmber,
    background = NeutralBackground,
    surface = NeutralCard,
    onBackground = NeutralDark,
    onSurface = NeutralDark,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = NeutralMuted,
    outline = NeutralBorder
  )

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}

