import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';

class AppointmentTimeslot {
  const AppointmentTimeslot({
    required this.timeslotId,
    required this.startTime,
    required this.endTime,
    required this.display,
    required this.isBooked,
  });

  final int timeslotId;
  final String startTime;
  final String endTime;
  final String display;
  final bool isBooked;

  factory AppointmentTimeslot.fromJson(Map<String, dynamic> json) {
    return AppointmentTimeslot(
      timeslotId: json['timeslotId'] as int,
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
      display: json['display'] as String,
      isBooked: json['isBooked'] as bool,
    );
  }
}

class AppointmentPet {
  const AppointmentPet({
    required this.petId,
    required this.name,
    required this.breed,
  });

  final int petId;
  final String name;
  final String breed;

  factory AppointmentPet.fromJson(Map<String, dynamic> json) {
    final breedData = json['breed'];
    return AppointmentPet(
      petId: json['petId'] as int,
      name: json['petName'] as String,
      breed: breedData is Map<String, dynamic>
          ? breedData['breedName'] as String
          : 'Unknown breed',
    );
  }
}

class AppointmentServiceOption {
  const AppointmentServiceOption({required this.serviceId, required this.name});

  final int serviceId;
  final String name;

  factory AppointmentServiceOption.fromJson(Map<String, dynamic> json) {
    return AppointmentServiceOption(
      serviceId: json['serviceId'] as int,
      name: json['serviceName'] as String,
    );
  }
}

class AppointmentVeterinarian {
  const AppointmentVeterinarian({required this.vetId, required this.name});

  final int vetId;
  final String name;

  factory AppointmentVeterinarian.fromJson(Map<String, dynamic> json) {
    return AppointmentVeterinarian(
      vetId: json['vetId'] as int,
      name: json['name'] as String,
    );
  }
}

class AppointmentService {
  AppointmentService(this._apiClient);

  final ApiClient _apiClient;

  String _message(DioException e, String fallback) {
    final data = e.response?.data;
    return data is Map && data['message'] is String
        ? data['message']
        : fallback;
  }

  Future<List<AppointmentTimeslot>> fetchAvailability({
    required DateTime date,
    int? vetId,
  }) async {
    try {
      final response = await _apiClient.dio.get(
        '/availability',
        queryParameters: {
          'scheduledDate': _dateQueryValue(date),
          ...?vetId == null ? null : {'vetId': vetId},
        },
      );
      final List<dynamic> data = response.data;
      return data
          .map(
            (item) => AppointmentTimeslot.fromJson(
              Map<String, dynamic>.from(item as Map),
            ),
          )
          .toList();
    } on DioException catch (e) {
      throw Exception(_message(e, 'Failed to fetch appointment availability'));
    }
  }

  String _dateQueryValue(DateTime date) {
    final year = date.year.toString().padLeft(4, '0');
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  Future<List<AppointmentPet>> fetchUserPets() async {
    try {
      final response = await _apiClient.dio.get('/pets/me');
      final List<dynamic> data = response.data;
      return data
          .map(
            (item) =>
                AppointmentPet.fromJson(Map<String, dynamic>.from(item as Map)),
          )
          .toList();
    } on DioException catch (e) {
      throw Exception(_message(e, 'Failed to fetch user pets'));
    }
  }

  Future<List<AppointmentServiceOption>> fetchServices() async {
    try {
      final response = await _apiClient.dio.get('/services');
      final List<dynamic> data = response.data;
      return data
          .map(
            (item) => AppointmentServiceOption.fromJson(
              Map<String, dynamic>.from(item as Map),
            ),
          )
          .toList();
    } on DioException catch (e) {
      throw Exception(_message(e, 'Failed to fetch services'));
    }
  }

  Future<List<AppointmentVeterinarian>> fetchVeterinarians() async {
    try {
      final response = await _apiClient.dio.get('/vets');
      final List<dynamic> data = response.data;
      return data
          .map(
            (item) => AppointmentVeterinarian.fromJson(
              Map<String, dynamic>.from(item as Map),
            ),
          )
          .toList();
    } on DioException catch (e) {
      throw Exception(_message(e, 'Failed to fetch veterinarians'));
    }
  }

  // Calls POST /api/appointments
  Future<Map<String, dynamic>> createAppointment({
    required String petName,
    required String procedure,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/appointments',
        data: {'pet': petName, 'procedure': procedure},
      );
      return Map<String, dynamic>.from(response.data);
    } on DioException catch (e) {
      throw Exception(_message(e, 'Failed to create appointment'));
    }
  }
}
