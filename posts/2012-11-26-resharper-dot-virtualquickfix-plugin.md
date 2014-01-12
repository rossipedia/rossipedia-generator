---
layout: post
title: "ReSharper.VirtualQuickFix Plugin"
date: 2012-11-26 01:03
comments: true
categories: development
tags:
- resharper
- plugins
---

This is a simple plugin based on [Hadi Hariri's blog post][1] on
creating plugins for [ReSharper][2]. I actually had a need for this in
one of my projects, so I figured I'd try my hand at the plugin.
Unfortunately, it was written for an older version of ReSharper and
didn't translate exactly. So this is an updated version of the plugin
for ReSharper Version 7.x

<!-- more -->

### Features

This plugin provides two features:

1. Highlights any public method or property that isn't virtual.
2. Provides a QuickFix to make that method or property virtual.

That's it!

### Versions Supported

This plugin should work with Visual Studio 2010 and 2012, ReSharper
versions 7.x (unless JetBrains decides to change the plugin API).  I
have only tested it on VS 2012 + R# 7.0.1 so far. If it doesn't work
for you, please feel free to drop me an email and I'll see what I can
do.

### Installation

I haven't gotten around to creating an installer for this yet, so
you'll have to manually copy the DLL to the correct folder for your
installation of ReSharper and Visual Studio:

`%LOCALAPPDATA%\JetBrains\ReSharper\v7.0\vs10.0`

(Replace **v7.0** with **v7.1** for ReSharper 7.1, and **vs10.0** with
 **vs11.0** for Visual Studio 2012).

You can download the DLL [here][3], or checkout the source on
[GitHub][4]

[1]: http://hadihariri.com/2010/01/12/writing-plug-ins-for-resharper-part-1-of-undefined/
[2]: http://www.jetbrains.com/resharper/
[3]: https://github.com/downloads/rossipedia/Resharper.VirtualQuickFix/Resharper.VirtualQuickFix-1.0.1.zip
[4]: https://github.com/rossipedia/Resharper.VirtualQuickFix
