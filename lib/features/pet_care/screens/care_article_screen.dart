import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_theme.dart';
import '../models/care_article.dart';

const _teal = Color(0xFF068A98);
const _tealDark = Color(0xFF05808A);
const _mint = Color(0xFFE0F2F1);
const _sun = Color(0xFFFFF0B8);
const _ytRed = Color(0xFFE53935);

/// Shows a video thumbnail from either a network URL (starts with http)
/// or a bundled asset path (e.g. 'assets/images/ear_cleaning_preview.png').
/// Falls back to a yellow placeholder when empty or when loading fails.
class CareThumbnail extends StatelessWidget {
  const CareThumbnail({super.key, this.source});

  final String? source;

  Widget _placeholder() => Container(
    color: _sun,
    alignment: Alignment.center,
    child: const Icon(Icons.pets_rounded, color: _teal, size: 40),
  );

  @override
  Widget build(BuildContext context) {
    final s = source;
    if (s == null || s.isEmpty) return _placeholder();
    if (s.startsWith('http')) {
      return Image.network(
        s,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => _placeholder(),
        loadingBuilder: (context, child, progress) =>
            progress == null ? child : _placeholder(),
      );
    }
    return Image.asset(
      s,
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => _placeholder(),
    );
  }
}

class CareArticleScreen extends StatelessWidget {
  const CareArticleScreen({super.key, required this.article});

  final CareArticle article;

  bool get _isVideo => article.type == CareContentType.video;

  Future<void> _openExternal(BuildContext context) async {
    final uri = Uri.parse(article.url);
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black54,
      builder: (dialogContext) => _LeavingDialog(
        article: article,
        onContinue: () => Navigator.pop(dialogContext, true),
        onStay: () => Navigator.pop(dialogContext, false),
      ),
    );
    if (confirmed == true) {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open the link.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5FAFA),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                children: [
                  Row(
                    children: [
                      IconButton.outlined(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back),
                        iconSize: 24,
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          fixedSize: const Size(48, 48),
                          side: const BorderSide(color: AppTheme.border),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          _isVideo ? 'Video guide' : 'Article',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.heading,
                          ),
                        ),
                      ),
                      const SizedBox(width: 48),
                    ],
                  ),
                  const SizedBox(height: 18),
                  _isVideo ? _VideoHero(article: article) : _ArticleHero(article: article),
                  const SizedBox(height: 24),
                  const _SectionHeading('SUMMARY'),
                  const SizedBox(height: 10),
                  Text(
                    article.summary,
                    style: const TextStyle(
                      fontSize: 16,
                      height: 1.45,
                      color: AppTheme.heading,
                    ),
                  ),
                  if (article.takeaways.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    const _SectionHeading('KEY TAKEAWAYS'),
                    const SizedBox(height: 12),
                    for (final takeaway in article.takeaways)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              margin: const EdgeInsets.only(top: 1),
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(
                                color: _mint,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.check_rounded,
                                size: 16,
                                color: _teal,
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
                  const SizedBox(height: 8),
                  if (article.url.isNotEmpty)
                    _SourceCard(
                      article: article,
                      onTap: () => _openExternal(context),
                    ),
                ],
              ),
            ),
            // Pinned bottom action
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_isVideo)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 10),
                      child: Text(
                        'Preview only · Video opens on YouTube',
                        style: TextStyle(fontSize: 12, color: AppTheme.muted),
                      ),
                    ),
                  if (article.url.isNotEmpty)
                    FilledButton.icon(
                      onPressed: () => _openExternal(context),
                      style: FilledButton.styleFrom(
                        backgroundColor: _tealDark,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(52),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(26),
                        ),
                      ),
                      icon: const Icon(Icons.open_in_new),
                      iconAlignment: IconAlignment.end,
                      label: Text(
                        _isVideo ? 'Watch on YouTube' : 'Read full article',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ArticleHero extends StatelessWidget {
  const _ArticleHero({required this.article});

  final CareArticle article;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 150),
      padding: const EdgeInsets.all(26),
      decoration: BoxDecoration(
        color: _tealDark,
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
    );
  }
}

class _VideoHero extends StatelessWidget {
  const _VideoHero({required this.article});

  final CareArticle article;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(30),
      child: Container(
        color: _tealDark,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 120,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CareThumbnail(source: article.thumbnail),
                  if (article.thumbnailUrl != null &&
                      article.thumbnailUrl!.isNotEmpty)
                  Positioned(
                    top: 10,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Text(
                        'ILLUSTRATED PREVIEW',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                          color: Color(0xFF0B5F67),
                        ),
                      ),
                    ),
                  ),
                  Center(
                    child: Container(
                      width: 48,
                      height: 36,
                      decoration: BoxDecoration(
                        color: _ytRed,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.play_arrow_rounded,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        '${article.displayCategory} · Video'.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.6,
                          color: _sun,
                        ),
                      ),
                      const Spacer(),
                      const _YouTubeLogo(),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    article.title,
                    style: const TextStyle(
                      fontSize: 24,
                      height: 1.1,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                  if (article.subtitle != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      article.subtitle!,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withValues(alpha: 0.88),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _YouTubeLogo extends StatelessWidget {
  const _YouTubeLogo({this.dark = false});

  /// Use dark text (for light backgrounds).
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
          decoration: BoxDecoration(
            color: _ytRed,
            borderRadius: BorderRadius.circular(7),
          ),
          child: const Icon(
            Icons.play_arrow_rounded,
            color: Colors.white,
            size: 16,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          'YouTube',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: dark ? AppTheme.heading : Colors.white,
          ),
        ),
      ],
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
        fontSize: 13,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.4,
        color: AppTheme.muted,
      ),
    );
  }
}

class _SourceCard extends StatelessWidget {
  const _SourceCard({required this.article, required this.onTap});

  final CareArticle article;
  final VoidCallback onTap;

  bool get _isVideo => article.type == CareContentType.video;

  @override
  Widget build(BuildContext context) {
    final title = _isVideo && article.channel != null
        ? '@${article.channel}'
        : article.source;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _isVideo ? 'SOURCE · YOUTUBE' : 'SOURCE',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.muted,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                  if (_isVideo) ...[
                    const SizedBox(height: 4),
                    Text(
                      article.url,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12.5, color: _teal),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.open_in_new, size: 22, color: _teal),
          ],
        ),
      ),
    );
  }
}

class _LeavingDialog extends StatelessWidget {
  const _LeavingDialog({
    required this.article,
    required this.onContinue,
    required this.onStay,
  });

  final CareArticle article;
  final VoidCallback onContinue;
  final VoidCallback onStay;

  bool get _isVideo => article.type == CareContentType.video;

  @override
  Widget build(BuildContext context) {
    // Brand name as shown in the design; change if the app name differs.
    const appName = 'Raphacare';

    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(34)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(26, 30, 26, 26),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(
                color: _mint,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.open_in_new, size: 28, color: _teal),
            ),
            const SizedBox(height: 20),
            const Text(
              'You’re leaving $appName',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: AppTheme.heading,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _isVideo
                  ? 'This video will open on YouTube, outside $appName.'
                  : 'This article opens in your browser on an external website:\n${article.source}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                height: 1.4,
                color: AppTheme.muted,
              ),
            ),
            if (_isVideo) ...[
              const SizedBox(height: 18),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEFC0),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  children: [
                    const _YouTubeLogo(dark: true),
                    const SizedBox(height: 8),
                    Text(
                      article.title,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.heading,
                      ),
                    ),
                    if (article.channel != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        '@${article.channel}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.muted,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
            const SizedBox(height: 22),
            FilledButton(
              onPressed: onContinue,
              style: FilledButton.styleFrom(
                backgroundColor: _tealDark,
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Text(
                'Continue',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: onStay,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.heading,
                minimumSize: const Size.fromHeight(52),
                side: const BorderSide(color: AppTheme.border, width: 2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Text(
                'Stay in app',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }
}