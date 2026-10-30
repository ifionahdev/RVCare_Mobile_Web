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
  });

  final String title;
  final CareCategory category;
  final String readTime;
  final String summary;
  final List<String> takeaways;
  final String source;
  final String url;
  final IconData icon;
}
