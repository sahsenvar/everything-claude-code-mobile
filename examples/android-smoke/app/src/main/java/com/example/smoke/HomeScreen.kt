package com.example.smoke

import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue

@Composable
fun HomeScreen(viewModel: HomeViewModel) {
    val state by viewModel.state.collectAsState()
    Button(onClick = { viewModel.onIntent(HomeIntent.Increment) }) {
        Text("Count: ${state.count}")
    }
}
