import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';

class CustomerSettingsProfile {
  const CustomerSettingsProfile({
    required this.firstName,
    required this.lastName,
    required this.dateOfBirth,
  });

  final String firstName;
  final String lastName;
  final DateTime? dateOfBirth;

  factory CustomerSettingsProfile.fromJson(Map<String, dynamic> json) {
    final account = json['account'];
    if (account is! Map) {
      throw const FormatException('The customer profile response is invalid.');
    }

    final data = Map<String, dynamic>.from(account);
    final rawDate = data['dateOfBirth'];
    DateTime? dateOfBirth;
    if (rawDate != null) {
      if (rawDate is! String ||
          (dateOfBirth = DateTime.tryParse(rawDate)) == null) {
        throw const FormatException(
          'The customer profile response contains an invalid birthday.',
        );
      }
    }

    return CustomerSettingsProfile(
      firstName: data['firstName'] as String? ?? '',
      lastName: data['lastName'] as String? ?? '',
      dateOfBirth: dateOfBirth,
    );
  }
}

class AccountActivity {
  const AccountActivity({
    required this.id,
    required this.title,
    required this.detail,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String detail;
  final DateTime createdAt;

  factory AccountActivity.fromJson(Map<String, dynamic> json) {
    final createdAt = DateTime.tryParse(json['createdAt'] as String? ?? '');
    if (createdAt == null) {
      throw const FormatException('The account activity response is invalid.');
    }

    return AccountActivity(
      id: json['id'] as String,
      title: json['title'] as String,
      detail: json['detail'] as String,
      createdAt: createdAt,
    );
  }
}

class NotificationPreferences {
  const NotificationPreferences({required this.emailNotifications});

  final bool emailNotifications;

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    final emailNotifications = json['emailNotifications'];
    if (emailNotifications is! bool) {
      throw const FormatException(
        'The notification preferences response is invalid.',
      );
    }

    return NotificationPreferences(emailNotifications: emailNotifications);
  }
}

class SettingsService {
  const SettingsService(this._apiClient);

  final ApiClient _apiClient;

  Future<CustomerSettingsProfile> fetchMyProfile() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/customers/me',
    );
    final data = response.data;
    if (data == null) {
      throw const FormatException('The customer profile response is invalid.');
    }
    return CustomerSettingsProfile.fromJson(data);
  }

  Future<void> updateMyProfile({
    required String firstName,
    required String lastName,
    required String? dateOfBirth,
  }) async {
    await _apiClient.dio.put<void>(
      '/customers/me',
      data: {
        'firstName': firstName,
        'lastName': lastName,
        'dateOfBirth': dateOfBirth,
      },
    );
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    await _apiClient.dio.put<void>(
      '/auth/change-password',
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      },
    );
  }

  Future<NotificationPreferences> fetchNotificationPreferences() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/customers/me/notification-preferences',
    );
    final data = response.data;
    if (data == null) {
      throw const FormatException(
        'The notification preferences response is invalid.',
      );
    }
    return NotificationPreferences.fromJson(data);
  }

  Future<void> updateNotificationPreferences({
    required bool emailNotifications,
  }) async {
    await _apiClient.dio.put<void>(
      '/customers/me/notification-preferences',
      data: {'emailNotifications': emailNotifications},
    );
  }

  Future<List<AccountActivity>> fetchActivity() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/customers/me/activity',
    );
    final activities = response.data?['activities'];
    if (activities is! List) {
      throw const FormatException('The account activity response is invalid.');
    }

    return activities.map((entry) {
      if (entry is! Map) {
        throw const FormatException(
          'The account activity response contains an invalid entry.',
        );
      }
      return AccountActivity.fromJson(Map<String, dynamic>.from(entry));
    }).toList();
  }

  static String readableError(DioException error) {
    final responseData = error.response?.data;
    if (responseData is Map && responseData['message'] is String) {
      return responseData['message'] as String;
    }
    return 'Could not connect to your settings. Please try again.';
  }
}
