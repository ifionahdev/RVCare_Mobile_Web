# RaphaCare

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

import packages
flutter pub add dio flutter_secure_storage provider

## Running the mobile app

The API must be running on the same Wi-Fi network as the phone. The app defaults
to `http://192.168.1.15:5000/api`; if the laptop's LAN address changes, pass the
current address when starting Flutter:

```shell
flutter run --dart-define=API_URL=http://<laptop-ip>:5000/api
```

For an Android emulator, use `http://10.0.2.2:5000/api` instead.

## Discrete Mathematics 2 source code

See [DISCRETE_MATH_SOURCE_CODE.md](./DISCRETE_MATH_SOURCE_CODE.md)
for the scheduler, appointment state transitions, first-order-logic-style
query, and relational mapping/indexing code excerpts.
