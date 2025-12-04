import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/user";
import Channel from "@/lib/models/channel";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    console.log("Here------------>", existingUser);

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      isOnline: true,
      lastSeen: new Date(),
    });

    console.log("USER:_______", user);

    // Add user to general channel if it exists, or create it
    let generalChannel = await Channel.findOne({ name: "general" });

    if (!generalChannel) {
      generalChannel = await Channel.create({
        name: "general",
        description: "General discussion channel",
        createdBy: user._id,
        members: [user._id],
      });
    } else {
      await Channel.findByIdAndUpdate(generalChannel._id, {
        $addToSet: { members: user._id },
      });
    }

    await createSession(user);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error", stack: error.stack },
      { status: 500 }
    );
  }
}
