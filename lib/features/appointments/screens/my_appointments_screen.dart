import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_bottom_navigation.dart';
import 'appointment_details_screen.dart';

class MyAppointmentsScreen extends StatefulWidget {
  const MyAppointmentsScreen({super.key});

  @override
  State<MyAppointmentsScreen> createState() => _MyAppointmentsScreenState();
}

class _MyAppointmentsScreenState extends State<MyAppointmentsScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    final upcoming = _selectedTab == 0;
    final past = _selectedTab == 1;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F9FC),
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
          children: [
            const Text(
              'My Appointments',
              style: TextStyle(
                color: AppTheme.heading,
                fontSize: 22,
                fontWeight: FontWeight.w800,
                height: 1.15,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Track bookings for all your pets',
              style: TextStyle(color: AppTheme.muted, fontSize: 14),
            ),
            const SizedBox(height: 20),
            Container(
              height: 58,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: const Color(0xFFE6EEF0),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  _tab('Upcoming · 2', 0),
                  _tab('Past', 1),
                  _tab('Cancelled', 2),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (upcoming) ...[
              _appointmentCard(
                weekday: 'Wed',
                month: 'Nov',
                dayNumber: '4',
                title: 'Checkup',
                pet: 'Luna',
                startTime: '10:00 AM',
                endTime: '11:00 AM',
                veterinarian: 'Dr. Rachel Carter',
                status: 'Confirmed',
                footerText: 'APT-20261104-01',
                reference: 'APT-20261104-01',
              ),
              const SizedBox(height: 12),
              _appointmentCard(
                weekday: 'Wed',
                month: 'Dec',
                dayNumber: '2',
                title: 'Vaccination',
                pet: 'Luna',
                startTime: '3:00 PM',
                endTime: '4:00 PM',
                veterinarian: 'Dr. Alan Mercer',
                status: 'Pending',
                footerText: 'Awaiting clinic confirmation',
              ),
              const SizedBox(height: 16),
              _bookBanner(),
            ] else if (past)
              _appointmentCard(
                weekday: 'Mon',
                month: 'Oct',
                dayNumber: '12',
                title: 'Laboratory Tests',
                pet: 'Luna',
                startTime: '2:00 PM',
                endTime: '3:00 PM',
                veterinarian: 'Dr. Rachel Carter',
                status: 'Completed',
                footerText: 'APT-20261012-01',
                reference: 'APT-20261012-01',
              )
            else
              Container(
                height: 180,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: const Text(
                  'No cancelled appointments',
                  style: TextStyle(color: AppTheme.muted),
                ),
              ),
          ],
        ),
      ),
      bottomNavigationBar: AppBottomNavigation(
        selectedIndex: 1,
        items: const [
          AppBottomNavItem(icon: Icons.home_outlined, label: 'Home'),
          AppBottomNavItem(
            icon: Icons.calendar_today_outlined,
            label: 'Bookings',
          ),
          AppBottomNavItem(icon: Icons.description_outlined, label: 'Records'),
          AppBottomNavItem(icon: Icons.menu_book_outlined, label: 'Pet Care'),
        ],
        onSelected: (index) => Navigator.pop(context),
      ),
    );
  }

  Widget _tab(String label, int index) {
    final selected = _selectedTab == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedTab = index),
        borderRadius: BorderRadius.circular(11),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? AppTheme.primaryDark : Colors.transparent,
            borderRadius: BorderRadius.circular(11),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: AppTheme.primaryDark.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Text(
            label,
            maxLines: 1,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: selected ? Colors.white : AppTheme.muted,
            ),
          ),
        ),
      ),
    );
  }

  // ------------------------------------------------------ appointment card

  Widget _appointmentCard({
    required String weekday,
    required String month,
    required String dayNumber,
    required String title,
    required String pet,
    required String startTime,
    required String endTime,
    required String veterinarian,
    required String status,
    required String footerText,
    String? reference,
  }) {
    final confirmed = status == 'Confirmed';

    return InkWell(
      onTap: () => Navigator.push<void>(
        context,
        MaterialPageRoute<void>(
          builder: (_) => AppointmentDetailsScreen(
            date: '$weekday, $month $dayNumber',
            procedure: title,
            pet: pet,
            time: startTime,
            veterinarian: veterinarian,
            status: status,
            reference: reference,
          ),
        ),
      ),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _dateBadge(month, dayNumber, filled: confirmed),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              '$title for $pet',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.heading,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          _statusChip(status),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$weekday · $startTime – $endTime',
                        style: const TextStyle(
                          fontSize: 13,
                          height: 1.35,
                          color: AppTheme.muted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        veterinarian,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.muted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(height: 1, color: const Color(0xFFE9EEF2)),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: Text(
                    footerText,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.muted,
                    ),
                  ),
                ),
                const Text(
                  'View details',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryDark,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: AppTheme.primaryDark,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _dateBadge(String month, String dayNumber, {required bool filled}) {
    final fg = filled ? Colors.white : AppTheme.primaryDark;
    return Container(
      width: 58,
      height: 64,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: filled ? AppTheme.primaryDark : const Color(0xFFDDF1F5),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            month.toUpperCase(),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: fg,
            ),
          ),
          Text(
            dayNumber,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              height: 1.1,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusChip(String status) {
    late final Color bg;
    late final Color fg;
    switch (status) {
      case 'Confirmed':
        bg = const Color(0xFFE6F6EC);
        fg = const Color(0xFF1B7F3B);
        break;
      case 'Pending':
        bg = const Color(0xFFFDEDE4);
        fg = const Color(0xFFB8400F);
        break;
      default:
        bg = const Color(0xFFEEF1F3);
        fg = AppTheme.muted;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }

  // ----------------------------------------------------------- book banner

  Widget _bookBanner() {
    return CustomPaint(
      foregroundPainter: _DashedRRectPainter(
        color: const Color(0xFF5CC6D0),
        radius: 16,
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFE8F5FA),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: const Color(0xFF5DE4F5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.edit_calendar_outlined,
                size: 24,
                color: AppTheme.heading,
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Need another visit?',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'See open slots and book in 2 steps',
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.3,
                      color: AppTheme.heading,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            SizedBox(
              height: 44,
              child: ElevatedButton(
                onPressed: () {
                  // TODO: navigate to the booking flow.
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryDark,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Book',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DashedRRectPainter extends CustomPainter {
  const _DashedRRectPainter({
    required this.color,
    required this.radius,
    this.dashLength = 5,
    this.gapLength = 4,
    this.strokeWidth = 1.2,
  });

  final Color color;
  final double radius;
  final double dashLength;
  final double gapLength;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final path = Path()
      ..addRRect(
        RRect.fromRectAndRadius(
          Offset.zero & size,
          Radius.circular(radius),
        ),
      );

    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final end = math.min(distance + dashLength, metric.length);
        canvas.drawPath(metric.extractPath(distance, end), paint);
        distance += dashLength + gapLength;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRRectPainter old) =>
      old.color != color ||
      old.radius != radius ||
      old.dashLength != dashLength ||
      old.gapLength != gapLength ||
      old.strokeWidth != strokeWidth;
}