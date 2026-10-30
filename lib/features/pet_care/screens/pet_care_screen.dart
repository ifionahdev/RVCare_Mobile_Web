import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/care_article.dart';
import '../widgets/care_article_card.dart';
import 'care_article_screen.dart';

class PetCareScreen extends StatefulWidget {
  const PetCareScreen({super.key});

  @override
  State<PetCareScreen> createState() => _PetCareScreenState();
}

class _PetCareScreenState extends State<PetCareScreen> {
  static const _articles = [
    CareArticle(
      title: 'Keeping your dog’s ears clean and healthy',
      category: CareCategory.grooming,
      readTime: '4 min read',
      summary: "A short guide to checking and cleaning your dog's ears at home, what is normal, and when a clinic visit is the safer choice.",
      takeaways: [
        'Check ears weekly for redness, odor or discharge.',
        'Use a vet-approved cleaner and avoid deep cotton swabs.',
        "Follow your vet's instructions for any prescribed ear drops.",
        'Book a visit if your pet scratches or shakes its head often.',
      ],
      source: 'rvcare.example/guides/ear-care',
      url: 'https://rvcare.example/guides/ear-care',
      icon: Icons.hearing_outlined,
    ),
    CareArticle(
      title: 'Choosing the right food by age',
      category: CareCategory.nutrition,
      readTime: '5 min',
      summary: 'Learn how nutritional needs change from puppyhood through the senior years.',
      takeaways: [
        'Choose food appropriate for your pet’s life stage.',
        'Measure portions instead of free-feeding.',
        'Ask your veterinarian before changing diet plans.',
      ],
      source: 'rvcare.example/guides/nutrition',
      url: 'https://rvcare.example/guides/nutrition',
      icon: Icons.water_drop_outlined,
    ),
    CareArticle(
      title: 'Vaccination schedule basics',
      category: CareCategory.vaccines,
      readTime: '3 min',
      summary: 'A simple overview of core vaccines and why your pet’s schedule matters.',
      takeaways: [
        'Keep an accurate vaccination record.',
        'Core vaccines and timing vary by location and lifestyle.',
        'Confirm booster dates with your veterinarian.',
      ],
      source: 'rvcare.example/guides/vaccines',
      url: 'https://rvcare.example/guides/vaccines',
      icon: Icons.shield_outlined,
    ),
    CareArticle(
      title: "Brushing your pet’s teeth at home",
      category: CareCategory.grooming,
      readTime: '4 min',
      summary: 'Build an easy dental care routine with pet-safe products.',
      takeaways: [
        'Use a toothbrush and toothpaste made for pets.',
        'Introduce brushing gradually and reward calm behavior.',
        'Schedule dental checks if you notice persistent bad breath.',
      ],
      source: 'rvcare.example/guides/dental-care',
      url: 'https://rvcare.example/guides/dental-care',
      icon: Icons.directions_walk_outlined,
    ),
  ];

  CareCategory _selectedCategory = CareCategory.all;
  String _query = '';

  List<CareArticle> get _visibleArticles {
    final query = _query.trim().toLowerCase();
    return _articles.where((article) {
      final categoryMatches =
          _selectedCategory == CareCategory.all ||
          article.category == _selectedCategory;
      final queryMatches =
          query.isEmpty ||
          '${article.title} ${article.category.label}'.toLowerCase().contains(
            query,
          );
      return categoryMatches && queryMatches;
    }).toList();
  }

  void _openArticle(CareArticle article) {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (_) => CareArticleScreen(article: article),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final visible = _visibleArticles;
    final featured = visible.isEmpty ? null : visible.first;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
        children: [
          const Text(
            'Pet Care',
            style: TextStyle(
              fontSize: 20,
              height: 1.05,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tips and guides from your clinic',
            style: TextStyle(fontSize: 14, color: AppTheme.muted),
          ),
          const SizedBox(height: 24),
          TextField(
            onChanged: (value) => setState(() => _query = value),
            decoration: InputDecoration(
              hintText: 'Search articles',
              prefixIcon: const Icon(Icons.search_rounded, size: 24),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(28),
                borderSide: const BorderSide(color: AppTheme.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(28),
                borderSide: const BorderSide(color: AppTheme.border),
              ),
            ),
          ),
          const SizedBox(height: 20),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: CareCategory.values.map((category) {
                final selected = category == _selectedCategory;
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: ChoiceChip(
                    label: Text(category.label),
                    selected: selected,
                    onSelected: (_) =>
                        setState(() => _selectedCategory = category),
                    selectedColor: const Color(0xFF068A98),
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: AppTheme.border),
                    labelStyle: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : const Color(0xFF536568),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    showCheckmark: false,
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 22),
          if (featured != null) ...[
            _FeaturedArticle(
              article: featured,
              onTap: () => _openArticle(featured),
            ),
            const SizedBox(height: 26),
            const Text(
              'LATEST GUIDES',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: AppTheme.muted,
                letterSpacing: 0.3,
              ),
            ),
            const SizedBox(height: 12),
          ],
          for (var index = 0; index < visible.length; index++) ...[
            if (index != 0) const SizedBox(height: 12),
            CareArticleCard(
              article: visible[index],
              onTap: () => _openArticle(visible[index]),
            ),
          ],
        ],
      ),
    );
  }
}

class _FeaturedArticle extends StatelessWidget {
  const _FeaturedArticle({required this.article, required this.onTap});

  final CareArticle article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(28, 22, 28, 22),
      constraints: const BoxConstraints(minHeight: 260),
      decoration: BoxDecoration(
        color: const Color(0xFF068A98),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'FEATURED',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
              color: Colors.white.withValues(alpha: 0.88),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            article.title,
            style: const TextStyle(
              fontSize: 24,
              height: 1.08,
              fontWeight: FontWeight.w900,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            '${article.category.label} · ${article.readTime}',
            style: TextStyle(
              fontSize: 18,
              color: Colors.white.withValues(alpha: 0.72),
            ),
          ),
          const SizedBox(height: 22),
          FilledButton(
            onPressed: onTap,
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF068A98),
              minimumSize: const Size(175, 58),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: const Text(
              'Read article',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}
