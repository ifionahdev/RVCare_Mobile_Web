import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../services/auth_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._service);

  final AuthService _service;

  AuthStatus _status = AuthStatus.unauthenticated;
  Map<String, dynamic>? _user;
  String? _error;
  bool _isLoading = false;

  AuthStatus get status => _status;
  Map<String, dynamic>? get user => _user;
  String? get error => _error;
  bool get isLoading => _isLoading;

  bool get isAuthenticated => _status == AuthStatus.authenticated;

  Future<void> bootstrap() async {
    _status = AuthStatus.unknown;
    _error = null;
    notifyListeners();

    try {
      final hasToken = await _service.hasToken();

      if (!hasToken) {
        _status = AuthStatus.unauthenticated;
        return;
      }

      _user = await _service.me();
      _status = AuthStatus.authenticated;
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        await _service.logout();
      }

      _user = null;
      _status = AuthStatus.unauthenticated;
      _error = AuthService.readableError(error);
    } catch (error) {
      _user = null;
      _status = AuthStatus.unauthenticated;
      _error = error.toString().replaceFirst('Exception: ', '');
    } finally {
      notifyListeners();
    }
  }

  Future<bool> login(String username, String password) async {
    if (_isLoading) return false;

    if (username.trim().isEmpty || password.isEmpty) {
      _error = 'Please enter your username and password.';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _service.login(username, password);
      _status = AuthStatus.authenticated;
      return true;
    } on DioException catch (error) {
      _status = AuthStatus.unauthenticated;
      _user = null;
      _error = AuthService.readableError(error);
      return false;
    } catch (error) {
      _status = AuthStatus.unauthenticated;
      _user = null;
      _error = error.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _service.logout();

    _user = null;
    _error = null;
    _status = AuthStatus.unauthenticated;

    notifyListeners();
  }
}
