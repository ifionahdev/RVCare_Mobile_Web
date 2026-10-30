import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/care_article.dart';

class CareArticleCard extends StatelessWidget {
  const CareArticleCard({
    super.key,
    required this.article,
    required this.onTap,
  });

  final CareArticle article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        constraints: const BoxConstraints(minHeight: 96),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F4F4),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                article.icon,
                size: 28,
                color: const Color(0xFF068A98),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    article.title,
                    style: const TextStyle(
                      fontSize: 16,
                      height: 1.12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                  const SizedBox(height: 7),
                  Text(
                    '${article.category.label} · ${article.readTime}',
                    style: const TextStyle(fontSize: 13, color: AppTheme.muted),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right_rounded,
              size: 24,
              color: AppTheme.muted,
            ),
          ],
        ),
      ),
    );
  }
}
