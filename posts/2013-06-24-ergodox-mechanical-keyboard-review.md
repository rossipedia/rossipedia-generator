---
title: "ErgoDox Mechanical Keyboard Review"
date: 2013-06-24 12:07
comments: true
categories:
- keyboards
---

The [ErgoDox](http://ergodox.org) is a custom split-hand ergonomic
mechanical keyboard project started by [GeekHack](http://geekhack.org)
forum member Dox, and contributed to and refined by many others. It
was offered as a kit on [MassDrop](http://www.massdrop.com) starting
in early 2013. After demand for a second run increased, MassDrop
offered a second group buy, which I jumped on and placed my order. As
of this writing, MassDrop is running a [third group buy](https://www.massdrop.com/buy/ergodox) for the ErgoDox.

This is going to be a review of my time with the ErgoDox, from
construction to roughly a week of use. My kit arrived on June 5th
2013, but I wasn't able to construct the board until June 16th, due to
the fact that 8 month old babies have an odd temporal vortex around
them that somehow sucks in available free time like a black hole sucks
in matter.

Yup, I spent my first Father's Day constructing a keyboard. Nerd
achievement unlocked.

<!-- more -->

Unfortunately I decided to write this review after finishing the
board, so sorry for the lack of pictures.

Build
-----

I purchased a FX888D soldering iron from Amazon for the build, and I
already had a roll of solder, which worked find for the build. I
followed along with WhiteFireDragons's [excellent video](http://www.youtube.com/watch?v=x1irVrAl3Ts),
and had no problems. I'm pretty sure I lucked way out as I had
everything work perfectly the first time.

Supplies
--------

* [Hakko FX888D Digital Soldering Iron](http://www.amazon.com/gp/product/B00AWUFVY8/ref=oh_details_o00_s00_i00?ie=UTF8&psc=1)
  (I used the stock tip it comes with)
* A roll of 60/40 0.032" Rosin Core solder from Radio Shack
* Wire tip cleaner (the one that comes with the FX88D is fine)
* A pair of side cutters (if you get the iron off Amazon it comes with one)
* Tweezers (_REQUIRED_ for SMDs in my opinion).
* (optional) A magnifying glass if your eyes aren't so good
* A ventilated work area.

Construction
------------

Construction was pretty simple: I just followed along the steps in the
YouTube video. I did run across a few things I wanted to comment on
though:

__SMDs__: These were fairly annoying. On the first PCBs these took me
quite a while (about 3 hours, but that's with breaks and
distractions). On the second PCB I got much faster results by
soldering only one side of the SMDs for an entire row first, and then
going back and soldering the 2nd lead.

Soldering an individual SMD is fairly straightforward:

1. Place a dab of solder on one of the pads.
2. Place SMD on PCB, and apply tip of iron to the _lead_, not the pad,
   until you feel the SMD drop into the solder.
3. Solder the 2nd lead.

__Teensy 2.0 Micro Controller__: The only thing to be wary of is when
breaking apart the header pins make sure you apply the force
correctly, as I ended up with a row that was one pin too short.
Thankfully the box came with extras.

__Micro USB Connector__: Part of the construction of the
ErgoDox requires cutting the male end off of a Micro USB cord and
getting at the internals. In the YouTube video, WFD uses a Dremel
rotary tool to do this, and I will say that if you have one, __USE
IT__. I had no such tool, and had to use a combination of side cutters
and needlenose pliers to extract the internals from the plastic
casing. Not fun.

__Resistors__: Neither WFD's video, nor the
[instructions](http://www.massdrop.com/ext/ergodox/assembly/) on
Massdrop explicitly clarify which resistors go where. As I am not an
electrical engineer I had to go figure out which resistors were the
2.2kΩ resistors (the one _without_ the dark brown stripe), and which
were the 220Ω resistors (the ones _with_ the dark brown stripe). If in
doubt, make your resistors look exactly like this (take note of the
resistor stripes and orientation):

![Resistors soldering positions](https://d3jqoivu6qpygv.cloudfront.net/img_bucket/ergodox/_W3T4003.jpg)

Final Assembly
--------------

The case of the ErgoDox consists of 5 laser-cut layers of acrylic
bolted together, and they arrive covered in protective paper adhered
to each side, presumably to prevent chipping while the laser performs
the cut. However, a couple of the layers did end up having chips
anyways, and the paper was burnt in a few places. Not a deal breaker,
as none of the plates were actually broken.

However, one of the plates on the left side had a problem where the
holes for the bolts hadn't been drilled out completely, and I had to
pop out the left-over plastic burrs that were left in the holes. I
also had to use a small phillips head screwdriver to bore out the
holes until the provided bolts would actually fit.

Programming / Layout
--------------------

Following the directions on MassDrop's assembly page for loading the
firmware on to the board was fairly straightforward and I had no
problem. Rather than repeat them, I'll link to MassDrop's page
[here](https://www.massdrop.com/ext/ergodox/assembly/#step-12).

I use a fairly sparse layout, which you can view
[here](https://www.massdrop.com/ext/ergodox/?referer=QJGS5L&hash=dc58f1a2f9d5222910e05c6a03b9f90b).

Use
---

I've been using the ErgoDox for a little over a week now, and for
normal typing (such as this post), I'm back up to 100% speed. However,
my [dayjob](http://careers.stackexchange.com) requires writing a lot
of code, and I'd say that due to the special symbols that have to be
used fairly consistently I'm only back up to about 85% of normal
speed.

I put together my board with Cherry MX Clear switches, and replaced
all the springs with 65g springs from
[OriginativeCo](https://www.originativeco.com/65g-springs). These
soften the switches every so slightly, and don't tire my fingers out
as much as the standard clear springs (which I believe are 67g, but
not sure).

Typing on this board is _extremely_ addicting. The fact that
it is a completely vertical layout (as opposed to staggered like most
standard keyboards) has made a huge difference in how i hold my
hands and fingers (_especially_ for the left hand, the difference is
huge). my hands are more relaxed, and my shoulders are less tense.

All in all, a great purchase and I'm extremely happy with this board.
At $200 for the bare board (add $37 for the
[DSA](http://keycapsdirect.com/key-caps.php) keycaps, and from $37-$50
for the DCS keycaps) it's not for everyone. But if you're into high
quality mechanical keyboards and like tinkering with electronics, then
I'd highly recommend it. The current group buy for the ErgoDox on
MassDrop ends on June 30th, 2013.
