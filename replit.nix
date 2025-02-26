{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/nixpkgs-unstable.tar.gz") {} }:
{
  deps = [
    pkgs.python3
    pkgs.chromium
    # Add any other system packages you need here.
  ];
}
