<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>@yield('title', config('app.name', 'RootTech Telephony'))</title>
  <meta name="description" content="RootTech Telephony System Management Portal">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="{{ asset('css/style.css') }}">
  <script>
    (function() {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
        document.addEventListener('DOMContentLoaded', () => document.body.classList.add('dark'));
      }
    })();
  </script>
  @stack('styles')
</head>
<body>

  @yield('content')

  <div id="toastContainer" class="toast-container"></div>

  <script src="{{ asset('js/app.js') }}"></script>
  @stack('scripts')
</body>
</html>
