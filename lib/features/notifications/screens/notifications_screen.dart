import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/notifications_service.dart';

const _background = Color(0xFFF4F8F8);
const _heading = Color(0xFF202D3E);
const _muted = Color(0xFF718399);
const _teal = Color(0xFF078891);
const _border = Color(0xFFDCE9EC);
const _mint = Color(0xFFDFF3F0);

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _notifications = [];
  bool _isLoading = true;
  Object? _loadError;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  int get _unreadCount =>
      _notifications.where((notification) => !notification.isRead).length;

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _loadError = null;
    });
    try {
      final result = await context
          .read<NotificationsService>()
          .fetchMyNotifications();
      if (!mounted) return;
      setState(() {
        _notifications = result;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadError = error;
        _isLoading = false;
      });
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await context.read<NotificationsService>().markAllRead();
      if (!mounted) return;
      setState(() {
        _notifications = _notifications
            .map((notification) => notification.markRead())
            .toList();
      });
    } catch (error) {
      _showError(error);
    }
  }

  Future<void> _markAsRead(AppNotification notification) async {
    if (notification.isRead) return;
    try {
      await context.read<NotificationsService>().markRead(notification.id);
      if (!mounted) return;
      setState(() {
        _notifications = _notifications
            .map((item) => item.id == notification.id ? item.markRead() : item)
            .toList();
      });
    } catch (error) {
      _showError(error);
    }
  }

  void _showError(Object error) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(NotificationsService.readableError(error)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  String _dateHeading(DateTime value) {
    const months = [
      'JANUARY',
      'FEBRUARY',
      'MARCH',
      'APRIL',
      'MAY',
      'JUNE',
      'JULY',
      'AUGUST',
      'SEPTEMBER',
      'OCTOBER',
      'NOVEMBER',
      'DECEMBER',
    ];
    final date = value.toLocal();
    final today = DateUtils.dateOnly(DateTime.now());
    final notificationDate = DateUtils.dateOnly(date);
    final prefix = notificationDate == today ? 'TODAY · ' : '';
    return '$prefix${date.day} ${months[date.month - 1]} ${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: SizedBox(
                height: 48,
                child: Row(
                  children: [
                    Material(
                      color: Colors.white,
                      shape: const CircleBorder(),
                      child: InkWell(
                        onTap: () => Navigator.pop(context),
                        customBorder: const CircleBorder(),
                        child: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: _border, width: 1.5),
                          ),
                          child: const Icon(
                            Icons.arrow_back_rounded,
                            color: _heading,
                            size: 22,
                          ),
                        ),
                      ),
                    ),
                    const Expanded(
                      child: Text(
                        'Notifications',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: _heading,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
                children: [
                  const Text(
                    'Stay in the loop',
                    style: TextStyle(
                      color: _heading,
                      fontSize: 24,
                      height: 1.1,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Appointment updates and records for your pet.',
                    style: TextStyle(color: _muted, fontSize: 14, height: 1.4),
                  ),
                  const SizedBox(height: 22),
                  if (_isLoading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 56),
                      child: Center(
                        child: CircularProgressIndicator(color: _teal),
                      ),
                    )
                  else if (_loadError != null)
                    _MessageState(
                      message: NotificationsService.readableError(_loadError!),
                      action: _loadNotifications,
                      actionLabel: 'Try again',
                    )
                  else if (_notifications.isEmpty)
                    const _MessageState(message: 'No notifications yet.')
                  else ...[
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 7,
                          ),
                          decoration: BoxDecoration(
                            color: _mint,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '$_unreadCount unread',
                            style: const TextStyle(
                              color: _teal,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: _unreadCount == 0 ? null : _markAllAsRead,
                          style: TextButton.styleFrom(
                            foregroundColor: _teal,
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                          ),
                          child: const Text(
                            'Mark all as read',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    for (
                      var index = 0;
                      index < _notifications.length;
                      index++
                    ) ...[
                      if (index == 0 ||
                          !DateUtils.isSameDay(
                            _notifications[index - 1].createdAt.toLocal(),
                            _notifications[index].createdAt.toLocal(),
                          )) ...[
                        if (index > 0) const SizedBox(height: 18),
                        _DateHeading(
                          _dateHeading(_notifications[index].createdAt),
                        ),
                        const SizedBox(height: 12),
                      ],
                      _NotificationCard(
                        notification: _notifications[index],
                        onTap: () => _markAsRead(_notifications[index]),
                      ),
                      const SizedBox(height: 12),
                    ],
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

class _MessageState extends StatelessWidget {
  const _MessageState({required this.message, this.action, this.actionLabel});

  final String message;
  final VoidCallback? action;
  final String? actionLabel;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 42),
      child: Column(
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: _muted),
          ),
          if (action != null) ...[
            const SizedBox(height: 12),
            TextButton(onPressed: action, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}

class _DateHeading extends StatelessWidget {
  const _DateHeading(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        color: _muted,
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.6,
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final icon = switch (notification.category.toLowerCase()) {
      'appointments' => Icons.calendar_month_rounded,
      'records' => Icons.description_outlined,
      _ => Icons.notifications_active_outlined,
    };
    final date = notification.createdAt.toLocal();
    final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
    final time =
        '$hour:${date.minute.toString().padLeft(2, '0')} ${date.hour < 12 ? 'AM' : 'PM'}';

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: _border),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _mint,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: _teal, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.category.toUpperCase(),
                      style: const TextStyle(
                        color: _teal,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.4,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      notification.title,
                      style: const TextStyle(
                        color: _heading,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      notification.message,
                      style: const TextStyle(
                        color: _muted,
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$time · ${notification.isRead ? 'Read' : 'Unread'}',
                      style: const TextStyle(color: _muted, fontSize: 10),
                    ),
                  ],
                ),
              ),
              if (!notification.isRead) ...[
                const SizedBox(width: 8),
                const Padding(
                  padding: EdgeInsets.only(top: 5),
                  child: CircleAvatar(radius: 3, backgroundColor: _teal),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
