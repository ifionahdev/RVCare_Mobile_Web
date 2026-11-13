import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rvcare/features/pet_care/models/care_article.dart';

void main() {
  test('maps published article content from the pet-care API', () {
    final article = CareArticle.fromJson({
      'type': 'article',
      'title': 'Daily hydration',
      'category': 'Health',
      'shortDescription': 'Keep fresh water available.',
      'detailedContent':
          '- Refresh the water daily.\nClean the bowl regularly.',
      'url': 'https://example.com/hydration',
      'icon': 'heart',
    });

    expect(article.title, 'Daily hydration');
    expect(article.displayCategory, 'Health');
    expect(article.summary, 'Keep fresh water available.');
    expect(article.takeaways, [
      'Refresh the water daily.',
      'Clean the bowl regularly.',
    ]);
    expect(article.icon, Icons.favorite_border);
    expect(article.type, CareContentType.article);
  });

  test('maps published video content and derives its YouTube thumbnail', () {
    final video = CareArticle.fromJson({
      'type': 'video',
      'title': 'Grooming basics',
      'category': 'Education',
      'shortDescription': 'Watch this video guide.',
      'detailedContent': '',
      'url': 'https://youtu.be/abc123',
      'icon': '',
    });

    expect(video.type, CareContentType.video);
    expect(video.displayCategory, 'Education');
    expect(video.thumbnail, 'https://img.youtube.com/vi/abc123/hqdefault.jpg');
    expect(video.readTime, isEmpty);
  });
}
