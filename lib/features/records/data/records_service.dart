import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:file_saver/file_saver.dart';

import '../../../core/network/api_client.dart';
import '../models/pet_record.dart';

class RecordsService {
  const RecordsService(this._apiClient);

  final ApiClient _apiClient;

  Future<List<PetRecord>> fetchMyRecords() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/records/mine',
    );
    final records = response.data?['records'];
    if (records is! List) {
      throw const FormatException('The records response is invalid.');
    }

    return records.map((entry) {
      if (entry is! Map) {
        throw const FormatException('A record in the response is invalid.');
      }
      return PetRecord.fromJson(Map<String, dynamic>.from(entry));
    }).toList();
  }

  Future<bool> downloadRecord(PetRecord record) async {
    final response = await _apiClient.dio.get<List<int>>(
      '/records/mine/${record.type.apiPathValue}/${record.id}/pdf',
      options: Options(responseType: ResponseType.bytes),
    );
    final bytes = response.data;
    if (bytes == null ||
        bytes.length < 5 ||
        String.fromCharCodes(bytes.take(5)) != '%PDF-') {
      throw const FormatException(
        'The server did not return a valid PDF for this record.',
      );
    }

    final savedPath = await FileSaver.instance.saveAs(
      name: record.fileName,
      bytes: Uint8List.fromList(bytes),
      fileExtension: 'pdf',
      mimeType: MimeType.pdf,
    );
    return savedPath != null;
  }

  static String readableError(Object error) {
    if (error is DioException) {
      final responseData = error.response?.data;
      if (responseData is Map && responseData['message'] is String) {
        return responseData['message'] as String;
      }
      if (responseData is List<int>) {
        try {
          final decoded = jsonDecode(utf8.decode(responseData));
          if (decoded is Map && decoded['message'] is String) {
            return decoded['message'] as String;
          }
        } on FormatException {
          return 'Could not download the record. Please try again.';
        }
      }
      return 'Could not download the record. Please try again.';
    }
    return error.toString().replaceFirst('Exception: ', '');
  }
}
