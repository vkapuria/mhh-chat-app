import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateAdminSupportRequestEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userName, userEmail, userType, orderId, orderTitle, taskCode,
      customerName, customerEmail, expertName, expertEmail,
      amount, expertFee, issueType, message 
    } = body;

    // Validation
    if (!userName || !userEmail || !orderId || !issueType || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate email HTML
    const emailHtml = generateAdminSupportRequestEmail({
      userName,
      userEmail,
      userType,
      orderId,
      orderTitle,
      taskCode,
      customerName,
      expertName,
      amount,
      expertFee,
      issueType,
      message,
    });

    // Send email
    const result = await sendEmail({
      from: 'MHH Support <support@myhomeworkhelp.com>',
      to: 'orders@myhomeworkhelp.com',
      replyTo: userEmail,
      subject: `Support Request: ${taskCode} - ${issueType}`,
      html: emailHtml,
    });

    if (!result.success) {
      console.error('Email send error:', result.error);
      return NextResponse.json(
        { error: 'Failed to send support request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Support request sent successfully',
    });

  } catch (error) {
    console.error('Support contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}