
{ pkgs }: {
  deps = [
    pkgs.python3
    pkgs.playwright-driver
    pkgs.chromium
    pkgs.firefox
    pkgs.xorg.libX11
    pkgs.libxkbcommon
    pkgs.libgbm
    pkgs.libdrm
    pkgs.xorg.libxshmfence
    pkgs.mesa
    pkgs.cairo
    pkgs.pango
    pkgs.atk
    pkgs.glib
    pkgs.at-spi2-core
    pkgs.dbus
    pkgs.nspr
    pkgs.nss
    pkgs.cups
    pkgs.expat
    pkgs.alsa-lib
    pkgs.python39Full
    pkgs.nodejs
  ];
}
