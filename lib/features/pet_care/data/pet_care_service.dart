import '../../../core/network/api_client.dart';
import '../models/care_article.dart';

class PetCareService {
  const PetCareService(this._apiClient);

  final ApiClient _apiClient;

  Future<List<CareArticle>> fetchContent() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/pet-care/content',
    );
    final body = response.data;
    final content = body?['data'];
    if (body?['success'] != true || content is! List) {
      throw const FormatException('The pet-care content response is invalid.');
    }

    return content
        .whereType<Map<String, dynamic>>()
        .map(CareArticle.fromJson)
        .toList();
  }
}
