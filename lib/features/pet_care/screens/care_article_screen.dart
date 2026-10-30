import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_theme.dart';
import '../models/care_article.dart';

class CareArticleScreen extends StatelessWidget {
  const CareArticleScreen({super.key, required this.article});

  final CareArticle article;

  Future<void> _openExternal(BuildContext context) async {
    final uri = Uri.parse(article.url);
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black54,
      builder: (dialogContext) => _LeavingDialog(
        source: article.source,
        onContinue: () => Navigator.pop(dialogContext, true),
        onStay: () => Navigator.pop(dialogContext, false),
      ),
    );
    if (confirmed == true) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          children: [
            Row(
              children: [
                IconButton.outlined(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back),
                  iconSize: 28,
                  style: IconButton.styleFrom(
                    fixedSize: const Size(58, 58),
                    side: const BorderSide(color: AppTheme.border),
                  ),
                ),
                const SizedBox(width: 22),
                const Expanded(
                  child: Text(
                    'Article',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                ),
                const SizedBox(width: 80),
              ],
            ),
            const SizedBox(height: 18),
            Container(
              constraints: const BoxConstraints(minHeight: 150),
              padding: const EdgeInsets.all(26),
              decoration: BoxDecoration(
                color: const Color(0xFF068A98),
                borderRadius: BorderRadius.circular(30),
              ),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  article.title,
                  style: const TextStyle(
                    fontSize: 24,
                    height: 1.08,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 28),
            const _SectionHeading('SUMMARY'),
            const SizedBox(height: 14),
            Text(
              article.summary,
              style: const TextStyle(
                fontSize: 16,
                height: 1.45,
                color: Color(0xFF536568),
              ),
            ),
            const SizedBox(height: 26),
            const _SectionHeading('KEY TAKEAWAYS'),
            const SizedBox(height: 14),
            for (final takeaway in article.takeaways) ...[
              Padding(
                padding: const EdgeInsets.only(bottom: 18),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 3),
                      child: Icon(
                        Icons.check,
                        size: 24,
                        color: Color(0xFF068A98),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        takeaway,
                        style: const TextStyle(
                          fontSize: 16,
                          height: 1.35,
                          color: AppTheme.heading,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            _SourceCard(
              source: article.source,
              onTap: () => _openExternal(context),
            ),
            const SizedBox(height: 28),
            FilledButton.icon(
              onPressed: () => _openExternal(context),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF068A98),
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(58),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(29),
                ),
              ),
              icon: const Icon(Icons.open_in_new),
              iconAlignment: IconAlignment.end,
              label: const Text(
                'Read full article',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.4,
        color: AppTheme.muted,
      ),
    );
  }
}

class _SourceCard extends StatelessWidget {
  const _SourceCard({required this.source, required this.onTap});

  final String source;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF4F7F7),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'SOURCE',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.muted,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    source,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.open_in_new, size: 28, color: Color(0xFF068A98)),
          ],
        ),
      ),
    );
  }
}

class _LeavingDialog extends StatelessWidget {
  const _LeavingDialog({
    required this.source,
    required this.onContinue,
    required this.onStay,
  });

  final String source;
  final VoidCallback onContinue;
  final VoidCallback onStay;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(34)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(28, 34, 28, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: const BoxDecoration(
                color: Color(0xFFF1F7F7),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.open_in_new,
                size: 34,
                color: Color(0xFF068A98),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'You are leaving RVCare',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: AppTheme.heading,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              'This article opens in your browser on an external website:\n$source',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 19,
                height: 1.45,
                color: AppTheme.muted,
              ),
            ),
            const SizedBox(height: 26),
            FilledButton(
              onPressed: onContinue,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF068A98),
                minimumSize: const Size.fromHeight(54),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(32),
                ),
              ),
              child: const Text(
                'Continue',
                style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: onStay,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.heading,
                minimumSize: const Size.fromHeight(54),
                side: const BorderSide(color: AppTheme.border, width: 2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(32),
                ),
              ),
              child: const Text(
                'Stay in app',
                style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
