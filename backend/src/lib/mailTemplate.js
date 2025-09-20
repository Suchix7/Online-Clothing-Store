export const mailCode = (name, total, createdAt, shippingAddress, id) => {
  const idd = id ? id : "";
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Email</title>
  </head>
  <body style="margin:0; padding:0; background:#f5f5f5;">
    <!-- Background -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f5f5; margin:0; padding:0;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <!-- Container -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:640px; max-width:100%; background:#ffffff; border:1px solid #e9e9e9; border-radius:22px; overflow:hidden;">
            
            <!-- HERO (black) -->
            <tr>
              <td align="center" style="background:#000000; padding:32px 44px 26px 44px;">
                <div style=" line-height:42px; font-weight:800; color:#ffffff; letter-spacing:-0.2px;">
                <img src="https://res.cloudinary.com/dzgwsrqnf/image/upload/v1744472150/logo_vhbtso.png" alt="Online Clothing Store Logo" style="max-width:100%; height:auto; width:200px;"/>
                </div>
                <div style="font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:18px; font-weight:700; color:#ffffff; letter-spacing:.22em; text-transform:uppercase;">
                  ${name}
                </div>
                <div style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <div style="font-family:Arial, Helvetica, sans-serif; font-size:30px; line-height:38px; font-weight:800; color:#ffffff; letter-spacing:-0.2px;">
                  Thank You for Order
                </div>
                <div style="height:10px; line-height:10px; font-size:0;">&nbsp;</div>
                <div style="font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:22px; color:#dcdcdc; max-width:520px;">
                  Your order's in. We're working to get it packed up and out the door — expect a dispatch confirmation email soon.
                </div>
                <div style="height:20px; line-height:20px; font-size:0;">&nbsp;</div>
                <!-- CTA -->
                <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="#" style="height:44px;v-text-anchor:middle;width:230px;" arcsize="50%" stroke="f" fillcolor="#ffffff">
                    <w:anchorlock/>
                    <center style="color:#000000;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:700;">
                      Track Your Order
                    </center>
                  </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-- -->
                <a href="http://localhost:5173/profile" target="_blank" style="display:inline-block; padding:12px 22px; background:#ffffff; color:#000000; text-decoration:none; font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:700; line-height:20px; border-radius:999px; border:1px solid #ffffff;">
                  Track Your Order
                </a>
                <!--<![endif]-->
                <div style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:18px; color:#bfbfbf;">
                  Please allow 24 hours to track your order.
                </div>
              </td>
            </tr>

            <!-- META BAR (refined chips) -->
            <tr>
              <td style="padding:18px 26px 10px 26px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <!-- Status -->
                    <td valign="top" width="33.33%" style="padding:8px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fcfcfc; border:1px solid #ededed; border-radius:12px;">
                        <tr>
                          <td style="padding:12px 14px;">
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#666666;">Status</div>
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:700; color:#111111;">Shipped</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <!-- Date -->
                    <td valign="top" width="33.33%" style="padding:8px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fcfcfc; border:1px solid #ededed; border-radius:12px;">
                        <tr>
                          <td style="padding:12px 14px;">
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#666666;">Date</div>
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:700; color:#111111;">${createdAt}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <!-- Total -->
                    <td valign="top" width="33.33%" style="padding:8px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff; border:1px solid #111111; border-radius:12px;">
                        <tr>
                          <td style="padding:12px 14px;">
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#111111; opacity:.8;">Total</div>
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:800; color:#111111;">$${total}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- SUMMARY + ADDRESS CARD (polished) -->
            <tr>
              <td style="padding:10px 26px 26px 26px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e9e9e9; border-radius:16px;">
                  <tr>
                    <!-- Summary -->
                    <td valign="top" width="50%" style="width:50%; padding:24px; border-right:1px solid #efefef;">
                      <div style="font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:800; color:#111111; margin:0 0 12px 0;">Summary</div>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="padding:8px 0; border-bottom:1px dotted #e6e6e6;">
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#666666; margin:0;">Status</div>
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:600; color:#111111; margin:2px 0 0 0;">Shipped</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; border-bottom:1px dotted #e6e6e6;">
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#666666; margin:0;">Order created at</div>
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:600; color:#111111; margin:2px 0 0 0;">August 17, 2025</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0 0 0;">
                            <!-- Receipt-style total -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border:1px dashed #111111; border-radius:12px;">
                              <tr>
                                <td style="padding:12px 14px;">
                                  <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; text-transform:uppercase; letter-spacing:.05em; color:#111111; opacity:.8;">Total</div>
                                  <div style="font-family:Arial, Helvetica, sans-serif; font-size:18px; font-weight:800; color:#111111;">$${total}</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>

                    <!-- Address -->
                    <td valign="top" width="50%" style="width:50%; padding:24px;">
                      <div style="font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:800; color:#111111; margin:0 0 12px 0;">Shipping Address</div>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fafafa; border:1px solid #e6e6e6; border-radius:12px;">
                        <tr>
                          <td style="padding:14px 16px;">
                            <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#111111; margin:0;">${shippingAddress.street},${shippingAddress.city}, ${shippingAddress.landMark} </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Help prompt + Contact pills (same section, cleaner) -->
                      <div style="height:14px; line-height:14px; font-size:0;">&nbsp;</div>
                      <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:700; color:#111111; margin:0 0 8px 0;">Any problems with your order?</div>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td valign="top" style="padding:0 0 8px 0;">
                            <a href="mailto:testproject7828@gmail.com" style="display:inline-block; padding:10px 14px; border:1px solid #dddddd; border-radius:999px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#111111; text-decoration:none; background:#ffffff;">Email Us • testproject7828@gmail.com</a>
                          </td>
                        </tr>
                        <tr>
                          <td valign="top">
                            <a href="tel:+9779848917128" style="display:inline-block; padding:10px 14px; border:1px solid #dddddd; border-radius:999px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#111111; text-decoration:none; background:#ffffff;">Call Us • +977-9848917128</a>
                          </td>
                        </tr>
                      </table>
                    </td>

                  </tr>
                </table>
              </td>
            </tr>

            <!-- BUSINESS INQUIRY (black band) -->
            <tr>
              <td style="padding:0 26px 32px 26px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#111111; border:1px solid #111111; border-radius:18px;">
                  <tr>
                    <td align="center" style="padding:20px 24px 8px 24px;">
                      <div style="font-family:Arial, Helvetica, sans-serif; font-size:18px; line-height:24px; font-weight:800; color:#ffffff;">Want to talk business with us?</div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:6px 24px 20px 24px;">
                      <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:20px; color:#e6e6e6;">
                        Feel free to reach out to us at 
                        <a href="mailto:testproject7828@gmail.com" style="color:#ffffff; text-decoration:underline;">testproject7828@gmail.com</a><br/>
                        We open opportunities for all forms of business collaboration
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:0 26px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="height:1px; line-height:1px; background:#ededed; font-size:0;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 26px 34px 26px;">
                <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:18px; color:#8a8a8a;">
                  Sydney, Australia
                </div>
              </td>
            </tr>

          </table>
          <!-- /Container -->
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};
