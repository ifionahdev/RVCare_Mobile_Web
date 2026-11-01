class ApiConstants {
  ApiConstants._();

  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://127.0.0.1:5000/api',
  );

  static String get socketUrl {
    final uri = Uri.parse(baseUrl);
    final pathSegments = uri.pathSegments.where((segment) => segment != 'api').toList();
    final socketUri = uri.replace(pathSegments: pathSegments);
    return socketUri.toString().replaceFirst(RegExp(r'/$'), '');
  }
}
