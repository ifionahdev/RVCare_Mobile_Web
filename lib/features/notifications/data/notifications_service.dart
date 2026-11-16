import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';

class AppNotification {
  const AppNotification({
    required this.id,
    required this.category,
    required this.title,
    required this.message,
    required this.createdAt,
    required this.readAt,
  });

  final int id;
  final String category;
  final String title;
  final String message;
  final DateTime createdAt;
  final DateTime? readAt;

  bool get isRead => readAt != null;

  AppNotification markRead() => AppNotification(
    id: id,
    category: category,
    title: title,
    message: message,
    createdAt: createdAt,
    readAt: DateTime.now(),
  );

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final createdAt = DateTime.tryParse(json['createdAt'] as String? ?? '');
    final readAt = json['readAt'] == null
        ? null
        : DateTime.tryParse(json['readAt'] as String? ?? '');
    if (id is! int ||
        createdAt == null ||
        (json['readAt'] != null && readAt == null) ||
        json['category'] is! String ||
        json['title'] is! String ||
        json['message'] is! String) {
      throw const FormatException('A notification in the response is invalid.');
    }

    return AppNotification(
      id: id,
      category: json['category'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      createdAt: createdAt,
      readAt: readAt,
    );
  }
}

class NotificationsService {
  const NotificationsService(this._apiClient);

  final ApiClient _apiClient;

  Future<List<AppNotification>> fetchMyNotifications() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/customers/me/notifications',
    );
    final data = response.data?['notifications'];
    if (data is! List) {
      throw const FormatException('The notifications response is invalid.');
    }
    return data.map((entry) {
      if (entry is! Map) {
        throw const FormatException(
          'A notification in the response is invalid.',
        );
      }
      return AppNotification.fromJson(Map<String, dynamic>.from(entry));
    }).toList();
  }

  Future<void> markRead(int id) async {
    await _apiClient.dio.patch<void>('/customers/me/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _apiClient.dio.patch<void>('/customers/me/notifications/read-all');
  }

  static String readableError(Object error) {
    if (error is DioException) {
      final response = error.response?.data;
      if (response is Map && response['message'] is String) {
        return response['message'] as String;
      }
      return 'Could not load notifications. Please try again.';
    }
    return error.toString().replaceFirst('Exception: ', '');
  }
}
