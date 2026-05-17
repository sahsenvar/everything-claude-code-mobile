plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.example.smoke"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.example.smoke"
        minSdk = 24
        targetSdk = 34
    }
}
