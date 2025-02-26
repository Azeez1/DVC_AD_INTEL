
{ pkgs }: {
  deps = [
    pkgs.python3
    pkgs.playwright-driver
    pkgs.chromium
    pkgs.firefox
    pkgs.xorg.libX11
    pkgs.libxkbcommon
    pkgs.mesa.drivers
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
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXfixes
    pkgs.xorg.libxcb
    pkgs.at-spi2-atk
  ];
}
