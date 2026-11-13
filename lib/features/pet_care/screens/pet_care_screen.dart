import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../data/pet_care_service.dart';
import '../models/care_article.dart';
import 'care_article_screen.dart';

const _teal = Color(0xFF068A98);
const _mint = Color(0xFFE0F2F1);
const _sun = Color(0xFFFFF0B8);

class PetCareScreen extends StatefulWidget {
  const PetCareScreen({super.key});

  @override
  State<PetCareScreen> createState() => _PetCareScreenState();
}

class _PetCareScreenState extends State<PetCareScreen> {
  static const _maxFeatured = 3;
  // Start deep inside an endless PageView so you can swipe either way forever.
  // 1200 is divisible by 1, 2 and 3 so the first card is always first.
  static const _loopStart = 1200;

  List<CareArticle> _articles = [];
  bool _isLoading = true;
  String? _loadError;
  final _pageController = PageController(
    viewportFraction: 0.88,
    initialPage: _loopStart,
  );
  String _filter = 'All';
  String _query = '';
  int _page = _loopStart;

  @override
  void initState() {
    super.initState();
    _loadContent();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadContent() async {
    setState(() {
      _isLoading = true;
      _loadError = null;
    });
    try {
      final articles = await context.read<PetCareService>().fetchContent();
      if (!mounted) return;
      setState(() {
        _articles = articles;
        _isLoading = false;
      });
      _resetPager();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _loadError = 'Could not load pet-care content. Please try again.';
      });
    }
  }

  List<String> get _filters => [
    'All',
    'Articles',
    'Videos',
    ..._articles
        .map((article) => article.displayCategory)
        .where(
          (category) =>
              category.isNotEmpty &&
              category != 'All' &&
              category != 'Articles' &&
              category != 'Videos',
        )
        .toSet(),
  ];

  List<CareArticle> get _visible {
    final query = _query.trim().toLowerCase();
    return _articles.where((a) {
      if (_filter == 'Articles' && a.type != CareContentType.article) {
        return false;
      }
      if (_filter == 'Videos' && a.type != CareContentType.video) {
        return false;
      }
      if (_filter != 'All' &&
          _filter != 'Articles' &&
          _filter != 'Videos' &&
          a.displayCategory != _filter) {
        return false;
      }
      if (query.isEmpty) return true;
      return '${a.title} ${a.displayCategory}'.toLowerCase().contains(query);
    }).toList();
  }

  void _setFilter(String filter) {
    if (!_filters.contains(filter)) return;
    setState(() => _filter = filter);
    _resetPager();
  }

  /// Puts the carousel back on the first card after the list changes.
  void _resetPager() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_pageController.hasClients) return;
      final n = _visible.take(_maxFeatured).length;
      final start = n > 1 ? _loopStart : 0;
      _pageController.jumpToPage(start);
      setState(() => _page = start);
    });
  }

  void _open(CareArticle article) {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (_) => CareArticleScreen(article: article),
      ),
    );
  }

  String _countLabel(int n) => switch (_filter) {
    'Articles' => '$n ${n == 1 ? 'article' : 'articles'}',
    'Videos' => '$n ${n == 1 ? 'video' : 'videos'}',
    _ => '$n ${n == 1 ? 'guide' : 'guides'}',
  };

  @override
  Widget build(BuildContext context) {
    final visible = _visible;
    final featured = visible.take(_maxFeatured).toList();

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
        children: [
          // Header
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pet Care',
                      style: TextStyle(
                        fontSize: 34,
                        height: 1.05,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.heading,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Tips and guides from your clinic',
                      style: TextStyle(fontSize: 14, color: AppTheme.muted),
                    ),
                  ],
                ),
              ),
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _sun,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.pets_rounded, color: _teal, size: 24),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Search
          TextField(
            onChanged: (v) {
              setState(() => _query = v);
              _resetPager();
            },
            decoration: InputDecoration(
              hintText: 'Search articles and videos',
              prefixIcon: const Icon(Icons.search_rounded, size: 24),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
              border: _searchBorder(),
              enabledBorder: _searchBorder(),
              focusedBorder: _searchBorder(color: _teal),
            ),
          ),
          const SizedBox(height: 16),

          // Filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _filters.map((filter) {
                final selected = filter == _filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: ChoiceChip(
                    label: Text(filter),
                    selected: selected,
                    onSelected: (_) => _setFilter(filter),
                    selectedColor: _teal,
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: AppTheme.border),
                    showCheckmark: false,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    labelStyle: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : const Color(0xFF536568),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 14),

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: CircularProgressIndicator(color: _teal)),
            )
          else if (_loadError != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Column(
                children: [
                  Text(
                    _loadError!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppTheme.muted),
                  ),
                  const SizedBox(height: 12),
                  TextButton.icon(
                    onPressed: _loadContent,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Try again'),
                  ),
                ],
              ),
            )
          else ...[
          // Featured carousel
          if (featured.isNotEmpty) ...[
            SizedBox(
              height: 262,
              child: PageView.builder(
                controller: _pageController,
                // Endless loop when there is more than one card.
                itemCount: featured.length > 1 ? null : 1,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (_, i) {
                  final article = featured[i % featured.length];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: _FeaturedCard(
                      article: article,
                      onTap: () => _open(article),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 10),
            _CarouselDots(
              count: featured.length,
              index: _page % featured.length,
            ),
          ],
          const SizedBox(height: 22),

          // Section header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'EXPLORE OUR GUIDES',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.muted,
                  letterSpacing: 0.6,
                ),
              ),
              Text(
                _countLabel(visible.length),
                style: const TextStyle(fontSize: 13, color: AppTheme.muted),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (visible.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: Text(
                  'No guides match your search.',
                  style: TextStyle(color: AppTheme.muted),
                ),
              ),
            ),
          for (var i = 0; i < visible.length; i++) ...[
            if (i != 0) const SizedBox(height: 10),
            _GuideTile(article: visible[i], onTap: () => _open(visible[i])),
          ],
          ],
        ],
      ),
    );
  }

  OutlineInputBorder _searchBorder({Color color = AppTheme.border}) =>
      OutlineInputBorder(
        borderRadius: BorderRadius.circular(28),
        borderSide: BorderSide(color: color),
      );
}

class _CarouselDots extends StatelessWidget {
  const _CarouselDots({required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < count; i++)
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: i == index ? 18 : 6,
            height: 6,
            decoration: BoxDecoration(
              color: i == index ? _teal : const Color(0xFFCFE3E5),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        const SizedBox(width: 12),
        const Text(
          'Swipe left or right',
          style: TextStyle(fontSize: 12, color: AppTheme.muted),
        ),
      ],
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  const _FeaturedCard({required this.article, required this.onTap});

  final CareArticle article;
  final VoidCallback onTap;

  bool get _isVideo => article.type == CareContentType.video;

  Widget _buildVideo() {
    final channel = article.channel;
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: Container(
        color: const Color(0xFF05808A),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail with category badge
            SizedBox(
              height: 118,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CareThumbnail(source: article.thumbnail),
                  Positioned(
                    top: 12,
                    left: 14,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(
                        article.displayCategory.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.6,
                          color: _teal,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'FEATURED · VIDEO',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                        color: _sun,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      article.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 20,
                        height: 1.12,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    if (channel != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        '@$channel',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                    const Spacer(),
                    GestureDetector(
                      onTap: onTap,
                      behavior: HitTestBehavior.opaque,
                      child: const Row(
                        children: [
                          Text(
                            'Watch on YouTube',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: _sun,
                            ),
                          ),
                          SizedBox(width: 6),
                          Icon(
                            Icons.arrow_forward_rounded,
                            size: 18,
                            color: _sun,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isVideo) return _buildVideo();

    final meta = [
      article.displayCategory,
      if (article.readTime.isNotEmpty) article.readTime,
    ].join(' · ');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: BoxDecoration(
        color: const Color(0xFF05808A),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                _isVideo
                    ? Icons.play_circle_outline_rounded
                    : Icons.description_outlined,
                size: 16,
                color: _sun,
              ),
              const SizedBox(width: 8),
              Text(
                _isVideo ? 'FEATURED · VIDEO' : 'FEATURED · ARTICLE',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: _sun,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            article.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 21,
              height: 1.12,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            meta,
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withValues(alpha: 0.85),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            article.summary,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 14,
              height: 1.35,
              color: Colors.white.withValues(alpha: 0.78),
            ),
          ),
          const Spacer(),
          FilledButton.icon(
            onPressed: onTap,
            icon: const Icon(Icons.arrow_forward_rounded, size: 18),
            label: Text(
              _isVideo ? 'Watch video' : 'Read article',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
            iconAlignment: IconAlignment.end,
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: _teal,
              minimumSize: const Size(0, 44),
              padding: const EdgeInsets.symmetric(horizontal: 20),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GuideTile extends StatelessWidget {
  const _GuideTile({required this.article, required this.onTap});

  final CareArticle article;
  final VoidCallback onTap;

  bool get _isVideo => article.type == CareContentType.video;

  @override
  Widget build(BuildContext context) {
    final typeLabel = _isVideo ? 'Video' : 'Article';
    final meta = [
      typeLabel,
      article.displayCategory,
      if (!_isVideo && article.readTime.isNotEmpty) article.readTime,
    ].join(' · ');

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              Container(
                width: 34 * 1.0 + 0,
                height: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: _isVideo ? _sun : _mint,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _isVideo
                      ? Icons.play_circle_outline_rounded
                      : Icons.description_outlined,
                  color: _teal,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      article.title,
                      style: const TextStyle(
                        fontSize: 15,
                        height: 1.2,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.heading,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      meta,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: AppTheme.muted,
                      ),
                    ),
                    if (_isVideo && article.channel != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE53935),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Icon(
                              Icons.play_arrow_rounded,
                              color: Colors.white,
                              size: 14,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'YouTube',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.heading,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              '@${article.channel!}',
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: AppTheme.muted,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppTheme.muted,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}