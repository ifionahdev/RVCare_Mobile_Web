import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_bottom_navigation.dart';
import 'appointment_details_screen.dart';
import 'book_appointment_flow.dart';
import '../data/appointment_service.dart';
import '../../../core/network/realtime_provider.dart';

class MyAppointmentsScreen extends StatefulWidget {
  const MyAppointmentsScreen({super.key, this.showBottomNavigation = true});

  final bool showBottomNavigation;

  @override
  State<MyAppointmentsScreen> createState() => _MyAppointmentsScreenState();
}

class _MyAppointmentsScreenState extends State<MyAppointmentsScreen> {
  int _selectedTab = 0;
  List<Map<String, dynamic>> _appointments = [];
  bool _isLoading = true;
  int _realtimeRevision = -1;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final revision = context.watch<RealtimeProvider>().revision;
    if (_realtimeRevision != revision) {
      _realtimeRevision = revision;
      if (revision >= 0) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _loadAppointments();
        });
      }
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAppointments());
  }

  Future<void> _loadAppointments() async {
    try {
      final appointments = await context
          .read<AppointmentService>()
          .fetchAppointments();
      if (!mounted) return;
      setState(() {
        _appointments = appointments;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

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
                fontSize: 20,
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
                  _tab(
                    'Upcoming · ${_appointments.where((item) => item['status'] == 'Pending' || item['status'] == 'Incoming').length}',
                    0,
                  ),
                  _tab('Past', 1),
                  _tab('Cancelled', 2),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (upcoming) ...[
              for (final appointment in _appointments.where(
                (item) =>
                    item['status'] == 'Pending' || item['status'] == 'Incoming',
              )) ...[
                _backendAppointmentCard(appointment),
                const SizedBox(height: 12),
              ],
              const SizedBox(height: 16),
              _bookBanner(),
            ] else if (past)
              for (final appointment in _appointments.where(
                (item) => item['status'] == 'Completed',
              )) ...[
                _backendAppointmentCard(appointment),
                const SizedBox(height: 12),
              ]
            else if (_appointments.any((item) => item['status'] == 'Cancelled'))
              for (final appointment in _appointments.where(
                (item) => item['status'] == 'Cancelled',
              )) ...[
                _backendAppointmentCard(appointment),
                const SizedBox(height: 12),
              ]
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
      bottomNavigationBar: widget.showBottomNavigation
          ? AppBottomNavigation(
              selectedIndex: 1,
              items: const [
                AppBottomNavItem(icon: Icons.home_outlined, label: 'Home'),
                AppBottomNavItem(
                  icon: Icons.calendar_today_outlined,
                  label: 'Bookings',
                ),
                AppBottomNavItem(
                  icon: Icons.description_outlined,
                  label: 'Records',
                ),
                AppBottomNavItem(
                  icon: Icons.menu_book_outlined,
                  label: 'Pet Care',
                ),
              ],
              onSelected: (index) => Navigator.pop(context),
            )
          : null,
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

  Widget _backendAppointmentCard(Map<String, dynamic> appointment) {
    final date = DateTime.parse(appointment['scheduledDate'] as String);
    final pet = appointment['pet'] as Map<String, dynamic>;
    final service = appointment['service'] as Map<String, dynamic>;
    final timeslot = appointment['timeslot'] as Map<String, dynamic>;
    final veterinarian = appointment['veterinarian'] as Map<String, dynamic>;
    final account = veterinarian['account'] as Map<String, dynamic>;
    final rawStatus = appointment['status'] as String;
    final status = rawStatus == 'Incoming' ? 'Confirmed' : rawStatus;
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return _appointmentCard(
      weekday: weekdays[date.weekday - 1],
      month: months[date.month - 1],
      dayNumber: date.day.toString(),
      title: service['serviceName'] as String,
      pet: pet['petName'] as String,
      startTime: timeslot['startTime'] as String,
      endTime: timeslot['endTime'] as String,
      veterinarian: 'Dr. ${account['firstName']} ${account['lastName']}',
      status: status,
      footerText: 'APT-${appointment['appointmentId']}',
      reference: 'APT-${appointment['appointmentId']}',
      appointmentId: appointment['appointmentId'] as int,
    );
  }

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
    int? appointmentId,
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
            time: _formatTime(startTime),
            veterinarian: veterinarian,
            status: status,
            reference: reference,
            appointmentId: appointmentId,
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
                        '$weekday · ${_formatTime(startTime)} – ${_formatTime(endTime)}',
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
                    style: const TextStyle(fontSize: 12, color: AppTheme.muted),
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

  String _formatTime(String value) {
    final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(value.trim());
    if (match == null) return value;
    var hour = int.parse(match.group(1)!);
    final minute = int.parse(match.group(2)!);
    final period = hour >= 12 ? 'PM' : 'AM';
    if (hour == 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }
    return '$hour:${minute.toString().padLeft(2, '0')} $period';
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
              fontSize: 20,
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
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: fg),
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
                  Navigator.push<void>(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => const BookAppointmentFlow(),
                    ),
                  );
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
  const _DashedRRectPainter({required this.color, required this.radius})
    : dashLength = 5,
      gapLength = 4,
      strokeWidth = 1.2;

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
        RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius)),
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
