import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../data/appointment_service.dart';

class RescheduleAppointmentScreen extends StatefulWidget {
  const RescheduleAppointmentScreen({
    super.key,
    required this.date,
    required this.procedure,
    required this.pet,
    required this.time,
    required this.veterinarian,
    this.reference,
    this.appointmentId,
  });

  /// Current appointment date, e.g. "Wed, Nov 4".
  final String date;
  final String procedure;
  final String pet;

  /// Current appointment start time, e.g. "10:00 AM".
  final String time;
  final String veterinarian;
  final String? reference;
  final int? appointmentId;

  @override
  State<RescheduleAppointmentScreen> createState() =>
      _RescheduleAppointmentScreenState();
}

class _RescheduleAppointmentScreenState
    extends State<RescheduleAppointmentScreen> {
  static const Color _pageBg = Color(0xFFF4F9FC);
  static const Color _fieldBg = Color(0xFFEEF3F5);
  static const Color _selectedBg = Color(0xFFDDF1F5);
  static const Color _disabledText = Color(0xFF9AA7B3);

  static const _anyVet = 'Any available vet · fastest';

  static const _dates = [
    ('Mon', '2'),
    ('Tue', '3'),
    ('Wed', '4'),
    ('Thu', '5'),
    ('Fri', '6'),
    ('Sat', '7'),
  ];
  int _selectedDate = 4;
  String? _selectedTime;
  int? _selectedVetId;
  List<AppointmentVeterinarian> _vets = const [];
  List<AppointmentTimeslot> _slots = const [];
  bool _isLoadingAvailability = false;

  String _dateLabel(int index) =>
      '${_dates[index].$1}, Nov ${_dates[index].$2}';

  bool _isCurrentDate(int index) => widget.date == _dateLabel(index);

  DateTime get _selectedDateTime =>
      DateTime(2026, 11, int.parse(_dates[_selectedDate].$2));

  AppointmentTimeslot? get _selectedSlot {
    for (final slot in _slots) {
      if (slot.display == _selectedTime) return slot;
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadVets();
      _loadAvailability();
    });
  }

  Future<void> _loadVets() async {
    try {
      final vets = await context
          .read<AppointmentService>()
          .fetchVeterinarians();
      if (!mounted) return;
      setState(() => _vets = vets);
    } catch (_) {}
  }

  Future<void> _loadAvailability() async {
    setState(() {
      _isLoadingAvailability = true;
      _selectedTime = null;
    });
    try {
      final slots = await context.read<AppointmentService>().fetchAvailability(
        date: _selectedDateTime,
        vetId: _selectedVetId,
      );
      if (!mounted) return;
      setState(() {
        _slots = slots;
        _isLoadingAvailability = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _slots = const [];
        _isLoadingAvailability = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _pageBg,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                children: [
                  _buildTopBar(context),
                  const SizedBox(height: 20),
                  _buildCurrentCard(),
                  const SizedBox(height: 12),
                  _buildDateCard(),
                  const SizedBox(height: 16),
                  _sectionLabel('PREFERRED VET'),
                  const SizedBox(height: 8),
                  _buildVetField(),
                  const SizedBox(height: 16),
                  _sectionLabel('NEW TIME · 1 HR EACH'),
                  const SizedBox(height: 8),
                  _buildTimeGrid(context),
                  const SizedBox(height: 16),
                  _buildSummaryCard(),
                  const SizedBox(height: 14),
                  const Text(
                    'Free to reschedule up to 24 hours before your visit. '
                    'The clinic will re-confirm your new time.',
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: AppTheme.muted,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () => _confirmReschedule(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryDark,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Confirm New Time',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmReschedule(BuildContext context) async {
    if (widget.appointmentId == null) {
      Navigator.popUntil(context, (route) => route.isFirst);
      return;
    }

    final selectedSlot = _selectedSlot;
    if (selectedSlot == null) return;

    try {
      await context.read<AppointmentService>().rescheduleAppointment(
        appointmentId: widget.appointmentId!,
        scheduledDate: '2026-11-${_dates[_selectedDate].$2.padLeft(2, '0')}',
        timeslotId: selectedSlot.timeslotId,
        vetId: _selectedVetId,
      );
      if (!context.mounted) return;
      Navigator.popUntil(context, (route) => route.isFirst);
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  // ---------------------------------------------------------------- top bar

  Widget _buildTopBar(BuildContext context) {
    return SizedBox(
      height: 40,
      child: Row(
        children: [
          Material(
            color: Colors.white,
            shape: const CircleBorder(side: BorderSide(color: AppTheme.border)),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: () => Navigator.maybePop(context),
              child: const SizedBox(
                width: 40,
                height: 40,
                child: Icon(
                  Icons.arrow_back,
                  size: 20,
                  color: AppTheme.heading,
                ),
              ),
            ),
          ),
          const Expanded(
            child: Text(
              'Reschedule',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.heading,
              ),
            ),
          ),
          // Keeps the title visually centered.
          const SizedBox(width: 40),
        ],
      ),
    );
  }

  // ----------------------------------------------------------- current card

  Widget _buildCurrentCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE0F2F7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBFE3EA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'CURRENT APPOINTMENT',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: AppTheme.muted,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            '${widget.procedure} for ${widget.pet}',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${widget.date} · ${widget.time} · ${widget.veterinarian}',
            style: const TextStyle(fontSize: 13, color: AppTheme.muted),
          ),
          if (widget.reference != null) ...[
            const SizedBox(height: 8),
            Text(
              widget.reference!,
              style: const TextStyle(fontSize: 12, color: AppTheme.muted),
            ),
          ],
        ],
      ),
    );
  }

  // -------------------------------------------------------------- date card

  Widget _buildDateCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('PICK A NEW DATE · NOVEMBER 2026'),
          const SizedBox(height: 12),
          Row(
            children: [
              for (var i = 0; i < _dates.length; i++) ...[
                if (i != 0) const SizedBox(width: 8),
                Expanded(child: _dateChip(i)),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _dateChip(int index) {
    final disabled = _isCurrentDate(index);
    final selected = _selectedDate == index && !disabled;

    final chip = Container(
      height: 64,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: selected ? _selectedBg : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: disabled
            ? null
            : Border.all(
                color: selected ? AppTheme.primaryDark : AppTheme.border,
                width: selected ? 2 : 1,
              ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _dates[index].$1,
            style: TextStyle(
              fontSize: 12,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              color: selected ? AppTheme.primaryDark : AppTheme.muted,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            _dates[index].$2,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
        ],
      ),
    );

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: disabled
          ? null
          : () {
              setState(() => _selectedDate = index);
              _loadAvailability();
            },
      child: disabled
          ? CustomPaint(
              foregroundPainter: const _DashedRRectPainter(
                color: Color(0xFFC9D3DA),
                radius: 12,
              ),
              child: chip,
            )
          : chip,
    );
  }

  // -------------------------------------------------------------- vet field

  Widget _buildVetField() {
    return Column(
      children: [
        _vetOption(
          label: _anyVet,
          subtitle: 'Fastest · we assign the first open vet',
          initials: 'Any',
          selected: _selectedVetId == null,
          onTap: () => _selectVet(null),
        ),
        ..._vets.map(
          (vet) => Padding(
            padding: const EdgeInsets.only(top: 12),
            child: _vetOption(
              label: vet.name,
              subtitle: 'Select a specific veterinarian',
              initials: _vetInitials(vet.name),
              selected: _selectedVetId == vet.vetId,
              onTap: () => _selectVet(vet.vetId),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _selectVet(int? vetId) async {
    setState(() {
      _selectedVetId = vetId;
    });
    await _loadAvailability();
  }

  String _vetInitials(String name) {
    final parts = name.split(' ').where((part) => part.isNotEmpty).toList();
    final start = parts.length > 1 ? 1 : 0;
    return parts.skip(start).take(2).map((part) => part[0]).join();
  }

  Widget _vetOption({
    required String label,
    required String subtitle,
    required String initials,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        height: 72,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? const Color(0xFF55D6E5) : AppTheme.border,
            width: selected ? 3 : 1,
          ),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 21,
              backgroundColor: selected
                  ? const Color(0xFFDBF5F8)
                  : const Color(0xFFF0F1F2),
              child: Text(
                initials,
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: AppTheme.muted),
                  ),
                ],
              ),
            ),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected ? AppTheme.primary : const Color(0xFF9CA9B5),
                  width: 2,
                ),
              ),
              child: selected
                  ? const Center(
                      child: CircleAvatar(
                        radius: 6,
                        backgroundColor: AppTheme.primary,
                      ),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------- time grid

  Widget _buildTimeGrid(BuildContext context) {
    const gap = 10.0;
    final itemWidth = (MediaQuery.sizeOf(context).width - 40 - gap * 2) / 3;

    if (_isLoadingAvailability) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_slots.isEmpty) {
      return const Text(
        'No available time slots for this date and veterinarian.',
        style: TextStyle(fontSize: 13, color: AppTheme.muted),
      );
    }

    return Wrap(
      spacing: gap,
      runSpacing: gap,
      children: _slots.map((slot) {
        final unavailable = slot.isBooked;
        final selected = slot.display == _selectedTime && !unavailable;

        return SizedBox(
          width: itemWidth,
          height: 44,
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: unavailable
                ? null
                : () => setState(() => _selectedTime = slot.display),
            child: Container(
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: unavailable
                    ? _fieldBg
                    : (selected ? _selectedBg : Colors.white),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: selected ? AppTheme.primaryDark : AppTheme.border,
                  width: selected ? 2 : 1,
                ),
              ),
              child: Text(
                slot.display,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: unavailable
                      ? _disabledText
                      : (selected ? AppTheme.primaryDark : AppTheme.heading),
                  decoration: unavailable ? TextDecoration.lineThrough : null,
                  decorationColor: _disabledText,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ----------------------------------------------------------- summary card

  Widget _buildSummaryCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('SUMMARY'),
          const SizedBox(height: 8),
          Text(
            '${widget.date} · ${widget.time}',
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.muted,
              decoration: TextDecoration.lineThrough,
              decorationColor: AppTheme.muted,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${_dateLabel(_selectedDate)} · ${_selectedTime ?? 'Select a time'}',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.primaryDark,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------- helpers

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.6,
        color: AppTheme.muted,
      ),
    );
  }
}


class _DashedRRectPainter extends CustomPainter {
  const _DashedRRectPainter({required this.color, required this.radius})
    : dashLength = 4,
      gapLength = 3,
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
