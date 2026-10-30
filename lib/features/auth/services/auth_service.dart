import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/constants.dart';

class AuthService {
  AuthService({required ApiClient apiClient, required this._storage})
    : _dio = apiClient.dio;

  final Dio _dio;
  final FlutterSecureStorage _storage;

  static const String tokenKey = 'raphacare_token';

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {
          'username': username.trim(),
          'password': password,
          'platform': 'mobile',
        },
      );

      final data = Map<String, dynamic>.from(response.data as Map);

      final token = data['token'] as String;
      final user = Map<String, dynamic>.from(data['user'] as Map);

      if (user['role'] != 'customer') {
        throw Exception('Please use the RaphaCare web portal.');
      }

      await _storage.write(key: tokenKey, value: token);

      return user;
    } on DioException catch (error) {
      throw Exception(readableError(error));
    }
  }

  Future<Map<String, dynamic>> me() async {
    try {
      final response = await _dio.get('/auth/me');

      final data = Map<String, dynamic>.from(response.data as Map);

      final user = Map<String, dynamic>.from(data['user'] as Map);

      if (user['role'] != 'customer') {
        throw Exception('This account cannot use the mobile app.');
      }

      return user;
    } on DioException {
      rethrow;
    }
  }

  Future<bool> hasToken() async {
    final token = await _storage.read(key: tokenKey);
    return token != null && token.isNotEmpty;
  }

  Future<void> logout() async {
    await _storage.delete(key: tokenKey);
  }

  static String readableError(DioException error) {
    final responseData = error.response?.data;

    if (responseData is Map && responseData['message'] is String) {
      return responseData['message'] as String;
    }

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out. Please try again.';

      case DioExceptionType.connectionError:
        return 'Cannot connect to RaphaCare. Check your internet connection and server.';

      default:
        return 'Something went wrong. Please try again.';
    }
  }
}
