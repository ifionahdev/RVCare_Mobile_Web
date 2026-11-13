import 'package:flutter/material.dart';

enum CareCategory { all, nutrition, grooming, vaccines }

extension CareCategoryLabel on CareCategory {
  String get label => switch (this) {
    CareCategory.all => 'All',
    CareCategory.nutrition => 'Nutrition',
    CareCategory.grooming => 'Grooming',
    CareCategory.vaccines => 'Vaccines',
  };
}

enum CareContentType { article, video }

class CareArticle {
  const CareArticle({
    required this.title,
    required this.category,
    required this.readTime,
    required this.summary,
    required this.takeaways,
    required this.source,
    required this.url,
    required this.icon,
    this.categoryName = '',
    this.type = CareContentType.article,
    this.channel,
    this.thumbnailUrl,
    this.subtitle,
  });

  final String title;
  final CareCategory category;
  final String readTime;
  final String summary;
  final List<String> takeaways;
  final String source;
  final String url;
  final IconData icon;
  final String categoryName;

  /// Whether this entry is a written article or a video.
  final CareContentType type;

  /// Video channel name (e.g. 'DoveLewis'). Only used for videos.
  final String? channel;

  /// Thumbnail for videos: a network URL (http...) or an asset path
  /// (e.g. 'assets/images/ear_cleaning_preview.png'). Falls back to a
  /// placeholder when null or when the image fails to load.
  final String? thumbnailUrl;

  /// Short line under the title on the detail hero (videos),
  /// e.g. 'Safe ear cleaning · Vet tech demonstration'.
  final String? subtitle;

  bool get isVideo => type == CareContentType.video;
  String get displayCategory =>
      categoryName.isEmpty ? category.label : categoryName;

  factory CareArticle.fromJson(Map<String, dynamic> json) {
    final type = json['type'] == 'video'
        ? CareContentType.video
        : CareContentType.article;
    final categoryName = (json['category'] as String? ?? 'General').trim();
    final summary = (json['shortDescription'] as String? ?? '').trim();
    final detailedContent = (json['detailedContent'] as String? ?? '').trim();
    final url = (json['url'] as String? ?? '').trim();
    final contentLines = detailedContent
        .split(RegExp(r'[\r\n]+'))
        .map((line) => line.replaceFirst(RegExp(r'^\s*[-*•]\s*'), '').trim())
        .where((line) => line.isNotEmpty)
        .toList();
    final wordCount = detailedContent
        .split(RegExp(r'\s+'))
        .where((word) => word.isNotEmpty)
        .length;
    final estimatedMinutes = (wordCount / 200).ceil().clamp(1, 99);
    final parsedUrl = Uri.tryParse(url);

    return CareArticle(
      title: (json['title'] as String? ?? '').trim(),
      category: _categoryFor(categoryName),
      categoryName: categoryName,
      readTime: type == CareContentType.video
          ? ''
          : '$estimatedMinutes min read',
      summary: summary.isNotEmpty
          ? summary
          : type == CareContentType.video
          ? 'Watch this video guide.'
          : detailedContent,
      takeaways: contentLines,
      source: parsedUrl?.host.replaceFirst(RegExp(r'^www\.'), '') ?? url,
      url: url,
      icon: _iconFor(json['icon'] as String?),
      type: type,
    );
  }

  static CareCategory _categoryFor(String name) {
    switch (name.toLowerCase()) {
      case 'nutrition':
      case 'feeding':
        return CareCategory.nutrition;
      case 'grooming':
      case 'hygiene':
        return CareCategory.grooming;
      case 'vaccine':
      case 'vaccines':
      case 'vaccination':
        return CareCategory.vaccines;
      default:
        return CareCategory.all;
    }
  }

  static IconData _iconFor(String? key) {
    switch (key?.toLowerCase()) {
      case 'scissors':
        return Icons.content_cut;
      case 'dumbbell':
      case 'activity':
        return Icons.fitness_center;
      case 'droplets':
        return Icons.water_drop_outlined;
      case 'bone':
      case 'utensils':
        return Icons.restaurant_outlined;
      case 'puzzle':
        return Icons.extension_outlined;
      case 'heart':
        return Icons.favorite_border;
      case 'stethoscope':
        return Icons.medical_services_outlined;
      case 'bath':
        return Icons.bathtub_outlined;
      default:
        return Icons.article_outlined;
    }
  }

  /// Image to show for this item: the custom [thumbnailUrl] if set,
  /// otherwise the YouTube thumbnail derived from [url] (videos only).
  String? get thumbnail {
    final custom = thumbnailUrl;
    if (custom != null && custom.isNotEmpty) return custom;
    if (!isVideo) return null;
    final id = _youtubeId(url);
    return id == null ? null : 'https://img.youtube.com/vi/$id/hqdefault.jpg';
  }

  static String? _youtubeId(String link) {
    final uri = Uri.tryParse(link);
    if (uri == null) return null;
    final host = uri.host.replaceFirst('www.', '');
    if (host == 'youtu.be') {
      return uri.pathSegments.isEmpty ? null : uri.pathSegments.first;
    }
    if (host.endsWith('youtube.com')) {
      final v = uri.queryParameters['v'];
      if (v != null && v.isNotEmpty) return v;
      final seg = uri.pathSegments;
      if (seg.length >= 2 && (seg[0] == 'embed' || seg[0] == 'shorts')) {
        return seg[1];
      }
    }
    return null;
  }
}