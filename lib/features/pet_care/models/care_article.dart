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