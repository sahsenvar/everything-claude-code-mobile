package com.example.smoke

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class HomeState(val count: Int = 0)

sealed interface HomeIntent {
    data object Increment : HomeIntent
}

class HomeViewModel : ViewModel() {
    private val _state = MutableStateFlow(HomeState())
    val state: StateFlow<HomeState> = _state.asStateFlow()

    fun onIntent(intent: HomeIntent) {
        when (intent) {
            HomeIntent.Increment -> _state.value = _state.value.copy(count = _state.value.count + 1)
        }
    }
}
