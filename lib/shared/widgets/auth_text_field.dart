import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

class AuthTextField extends StatefulWidget {
  const AuthTextField({
    super.key,
    required this.label,
    required this.hint,
    required this.controller,
    this.email = false,
    this.password = false,
    this.enabled = true,
    this.textInputAction,
    this.onChanged,
  });

  final String label;
  final String hint;
  final TextEditingController controller;
  final bool email;
  final bool password;
  final bool enabled;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onChanged;

  @override
  State<AuthTextField> createState() => _AuthTextFieldState();
}

class _AuthTextFieldState extends State<AuthTextField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(
            color: AppTheme.heading,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: widget.controller,
          enabled: widget.enabled,
          obscureText: widget.password && _obscureText,
          keyboardType: widget.email
              ? TextInputType.emailAddress
              : TextInputType.text,
          textInputAction: widget.textInputAction,
          autocorrect: !widget.password,
          enableSuggestions: !widget.password,
          onChanged: widget.onChanged,
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: const TextStyle(color: AppTheme.muted, fontSize: 14),
            prefixIcon: Icon(
              widget.email
                  ? Icons.mail_outline
                  : widget.password
                  ? Icons.lock_outline
                  : Icons.person_outline,
              color: AppTheme.muted,
              size: 21,
            ),
            suffixIcon: widget.password
                ? IconButton(
                    tooltip: _obscureText ? 'Show password' : 'Hide password',
                    onPressed: () {
                      setState(() {
                        _obscureText = !_obscureText;
                      });
                    },
                    icon: Icon(
                      _obscureText
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      color: AppTheme.muted,
                      size: 21,
                    ),
                  )
                : null,
          ),
        ),
      ],
    );
  }
}
