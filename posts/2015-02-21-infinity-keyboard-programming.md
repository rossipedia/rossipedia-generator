---
title: "Programming the Infinity Keyboard"
date: 2015-02-25 00:00
comments: true
categories:
- keyboards
---

I received my Infinity Keyboard kit from [MassDrop][1] about a week ago, and
it's taken me a while to figure out how to program it. I'm going to document the
process here both for my own future reference and in the hopes that it can help
somebody else in the process. I will provide a more in-depth review in a later
post.


![Infinity Keyboard assembled](http://i.imgur.com/TmojAvT.jpg?1 "The Infinity Keyboard")

<!-- more -->

This guide assumes that you are on the Windows platform. While it's possible to
do this natively on Windows, it's a bit of a pain, so we're going to go with a
Virtual Machine based on the Ubuntu Minimal ISO/CD, since it's a super light
weight download (40MB as opposed to a multi-gigabyte download).


1. Prerequisite downloads:
--------------------------

* [Oracle VirtualBox][2]
* [Ubuntu Minimal ISO][3]

For each, make sure you download the correct version for your processor
(32-bit or 64-bit).


2. Installation
---------------

Okay, first off go ahead and install VirtualBox. Once that's up and running,
you'll want to create a new Virtual Machine. Call it whatever you want (I called
mine "Keyboard Dev"). Here are the specs I chose:

![Keyboard Dev VM](http://i.imgur.com/MzKzhJN.png)

Attach the downloaded `mini.iso` file to the VM. This can be done by right
clicking the VM and choosing "Settings", then going to the "Storage" section and
using the dropdown on the right to select the .iso file to attach to the VM's
drive:

![Keyboard Dev VM Storage Settings](http://i.imgur.com/1w8u4iu.png)


Now start up the VM!

3. Ubuntu Setup
---------------

When the VM boots up you'll be presented with the installation menu. I'm not
going to go into the details of a full-blown Ubuntu installation, but since this
is the Minimal ISO, anything you select for installation will need to be
downloaded and will make the setup process slower.

As I am based in the US and an English speaker, the defaults were fine for me.

Note: I set the username and password both to `kb`, since this VM will solely be
used for keyboard development. You are of course free to use whatever you wish.


4. Ubuntu Command Line
----------------------

For the sake of simplicity, I didn't choose any software packages to install
during setup. There is one tiny gotcha when doing this: after rebooting the
screen will come up blank. This is because Ubuntu expects there to be a
graphical X server and tries to hand off the session to one, but of course there
isn't one. It's fairly easily fixed.

1. Press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>F1</kbd> to switch to TTY1. You
   should see a login prompt. Go ahead and login.

2. You'll see a couple messages related to `systemd`. We don't need it, so go
   ahead and nuke it:

   ```bash
   $ sudo apt-get -y remove systemd
   ```

3. Ok, now let's fix that blank startup screen. The setting we need is in the
   file `/etc/grub.d/10_linux`. Let's edit that file (I use vi, but use
   whatever editor you are most comfortable with)

   ```bash
   $ sudo vi /etc/grub.d/10_linux
   ```

4. We need to comment out the line `vt_handoff="1"`. Do this by adding a `#` to
   the beginning of that line


5. Software Packages Installation
---------------------------------

Now we can install our prerequisite software for programming the keyboard:

```bash
$ sudo apt-get install -y git cmake ctags python3 libusb-1.0-0 \
    libusb-1.0-0-dev make gcc-arm-none-eabi binutils-arm-none-eabi \
    dfu-util
```

and clone the github repository for the controller:

```bash
$ git clone https://github.com/kiibohd/controller.git
$ cd controller
```


6. Compile default layout
-------------------------

Let's check to make sure we can build the default Infinity layout:

```bash
$ mkdir build_infinity
$ cd build_infinity
$ cmake ..
$ make
```

If all goes well, you should see a bunch of green lines scroll by, ending with
something like this:

```nohighlight
         SRAM:  32%    5384/16384      bytes
        Flash:  18%    23808/126976    bytes
[100%] Built target SizeAfter
```

Hooray! Your firmware has been built.

Now let's get set up for flashing


7. Flashing your keyboard's firmware
------------------------------------

You will need a second keyboard for this.

Press the re-flash button on the bottom of your keyboard. You should see the
orange LED light up indicating it's in DFI flashing mode.

Set up a USB filter for the Kiibohd DFU Bootloader (this is the device that
the computer sees the Infinity as when it's in re-flash mode).

Go to the Settings for the VM (the VM can be running for this), and the "USB"
section on the left. Then use the button on the right to add the USB filter:

![USB Filter Selection](http://i.imgur.com/mpBbQXl.png)

Now whenever the VM is running and you press the re-flash button on your
keyboard, the bootloader will connect directly to the VM and bypass the host
machine. I find this makes things just a bit easier when tweaking layouts, as
you don't have to constantly tell VirtualBox to connect the bootloader USB
device to the VM manually.

Back in the VM, enter the following (this is where you need another keyboard):

```bash
$ sudo ./load
```

Once you enter your password, the layout you built will be flashed on to your
keyboard. You should see a bunch of output about communication with the DFU
device. If you see the following line:

```nohighlight
state(7) = dfuMANIFEST, status(0) = No error condition is present
```

you're done! You have successfully built and flashed a new layout onto your
Infinity keyboard.

Next post I'll dive into KLL (Keyboard Layout Language), how it works, and
how to come up with your own layout.

[1]: https://www.massdrop.com/buy/infinity-keyboard-kit?mode=guest_open
[2]: https://www.virtualbox.org/wiki/Downloads
[3]: https://help.ubuntu.com/community/Installation/MinimalCD
