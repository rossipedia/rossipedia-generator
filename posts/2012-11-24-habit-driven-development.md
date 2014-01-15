---
layout: post
title: "Habit Driven Development"
date: 2012-12-12 02:04
comments: true
categories: development
tags:
- rant
---

I am constantly amazed at the difficulties that we have to deal with
day in and day out as a software developer due to somebody failing to
just stop and _think_ about what it is they're developing.

<!-- more -->

I'm working on a project right now where the models (if you can call
them that) are field-for-field equivalent to the database tables.

Now, that in and of itself is fine, if those models were strictly used
as DTOs (data transfer objects).

But no. Those models are used throughout the entire system.

I've run into this before, quite a bit. This idea that "SQL Server is
GOD!!!! The most important thing we need to do is get the DB structure
right. Everything else is secondary". Whenever I hear an idea like
that I just want to punch that person in the face.

The more I work on it, the more I run into this idea that it's being
done a certain way, because that's "how it's done".

There's no drive to figure out a better way. Things are just done a
certain way because that's how they've always been done.

Habit driven development.

Somebody shoot me.

*EDIT* Let me clarify that I _definitely_ think it's important to get
your DB structure right. But the main point I'm trying to get across
is don't let that structure dictate the design of _every element
across your codebase_.

