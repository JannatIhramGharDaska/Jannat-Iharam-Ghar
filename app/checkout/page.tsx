
'use client'

import React, { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatWhatsAppMessage } from '@/lib/whatsapp';
import { CheckCircle2, Copy, Check, Upload, Image as ImageIcon } from 'lucide-react';

export default function CheckoutPage() {
  const {
    cart,
    buyNowItem,
    clearBuyNowItem,
    deliveryFee,
    clearCart,
  } = useCart();

  const [isBuyNow, setIsBuyNow] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; subtotal: number } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsBuyNow(params.get('buyNow') === '1');
  }, []);

  const checkoutItems = isBuyNow
    ? (buyNowItem ? [buyNowItem] : [])
    : cart;

  const checkoutSubtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const checkoutBaseTotal =
    checkoutSubtotal > 0 ? checkoutSubtotal + deliveryFee : 0;

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    city: 'Lahore',
    orderNotes: '',
    paymentMethod: 'Cash on Delivery (COD)',
  });

  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [copiedAccount, setCopiedAccount] = useState('');
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  const codCharges =
    formData.paymentMethod === 'Cash on Delivery (COD)' ? 70 : 0;

  const couponDiscount = appliedCoupon && appliedCoupon.subtotal === checkoutSubtotal ? appliedCoupon.discount : 0;
  const orderTotal = Math.max(0, checkoutBaseTotal + codCharges - couponDiscount);

  const applyCoupon = async () => {
    setCouponBusy(true);
    setCouponError('');
    setAppliedCoupon(null);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, items: checkoutItems }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Coupon invalid.');
      setAppliedCoupon({ code: data.code, discount: data.discount, subtotal: data.subtotal });
    } catch (e) { setCouponError(e instanceof Error ? e.message : 'Coupon invalid.'); }
    finally { setCouponBusy(false); }
  };

  const isOnlinePayment =
    formData.paymentMethod !== 'Cash on Delivery (COD)';

  const handleCopyAccount = async (accountNumber: string, accountName: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccount(accountName);
      setTimeout(() => setCopiedAccount(''), 2000);
    } catch {
      alert('Copy nahi ho saka. Account number manually copy kar lein.');
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setPaymentScreenshot(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      alert('Sirf JPG, PNG aur WEBP images allowed hain.');
      e.target.value = '';
      setPaymentScreenshot(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Screenshot 5 MB ya us se chhota hona chahiye.');
      e.target.value = '';
      setPaymentScreenshot(null);
      return;
    }

    setPaymentScreenshot(file);
  };

  const pakistaniCities = [
    "Abbottabad","Ahmadpur East","Arifwala","Attock","Badin","Bahawalnagar","Bahawalpur","Bannu","Bhalwal","Bhakkar","Burewala","Chakwal","Charsadda","Chiniot","Daska","Dera Ghazi Khan","Dera Ismail Khan","Faisalabad","Ferozewala","Ghotki","Gojra","Gujranwala","Gujrat","Gwadar","Hafizabad","Haripur","Hyderabad","Islamabad","Jacobabad","Jaranwala","Jhang","Jhelum","Kamoke","Karachi","Kasur","Khairpur","Khanewal","Khanpur","Kohat","Kot Addu","Lahore","Larkana","Mandi Bahauddin","Mardan","Mingora","Mirpur AJK","Multan","Murree","Muzaffargarh","Nawabshah","Nowshera","Okara","Pakpattan","Peshawar","Quetta","Rahim Yar Khan","Rawalpindi","Sahiwal","Sargodha","Sheikhupura","Shikarpura","Sialkot","Sukkur","Swabi","Tando Adam","Tando Allahyar","Taxila","Thatta","Timergara","Toba Tek Singh","Vehari","Wah Cantt","Other"
  ];

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (checkoutItems.length === 0) {
      return alert(
        isBuyNow
          ? 'Selected product nahi mila. Product page par wapas ja kar Place Order dobara click karein.'
          : 'Your cart is empty!'
      );
    }

    if (isOnlinePayment && !paymentScreenshot) {
      return alert('Please upload your payment screenshot before placing the order.');
    }

    setSubmitting(true);

    try {
      let screenshotUrl: string | null = null;

      if (isOnlinePayment && paymentScreenshot) {
        const uploadForm = new FormData();
        uploadForm.append('file', paymentScreenshot);

        const uploadResponse = await fetch('/api/orders/payment-screenshot', {
          method: 'POST',
          body: uploadForm,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Payment screenshot upload failed.');
        }

        screenshotUrl = uploadResult.url;
      }

      const generatedOrderNumber = `JIG-${Math.floor(100000 + Math.random() * 900000)}`;

      const orderPayload = {
        orderNumber: generatedOrderNumber,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deliveryAddress: formData.deliveryAddress,
        city: formData.city,
        orderNotes: formData.orderNotes,
        paymentMethod: formData.paymentMethod,
        paymentScreenshot: screenshotUrl,
        subtotal: checkoutSubtotal,
        deliveryFee: deliveryFee,
        total: orderTotal,
        couponCode: couponDiscount > 0 ? appliedCoupon?.code : null,
        items: checkoutItems,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Order could not be placed.');
      }

      const confirmed = {
        ...orderPayload,
        orderNumber: result.orderNumber,
        total: result.total,
        discount: result.discount,
        items: result.items,
      };

      setCompletedOrder(confirmed);

      if (isBuyNow) {
        clearBuyNowItem();
      } else {
        clearCart();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Order could not be placed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    const waUrl = formatWhatsAppMessage(completedOrder);

    return (
      <div className="min-h-screen bg-[#080808] text-[#F5F0E6] px-4 py-16">
        <div className="max-w-2xl mx-auto bg-[#151515] border border-[#B88932]/40 rounded-2xl p-6 sm:p-8 text-center shadow-[0_15px_50px_rgba(0,0,0,0.4)]">
          <CheckCircle2 className="w-16 h-16 text-[#FFD76A] mx-auto mb-4" />

          <h1 className="text-2xl font-bold text-[#F5D780] mb-2">
            JazakAllah! Order Placed Successfully
          </h1>

          <div className="bg-[#171717] p-4 rounded-lg border text-left space-y-3 mb-6">
            <div>
              <p className="text-xs text-[#AFA38F] mb-1">Your Order Number</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-lg text-[#FFD76A] break-all">
                  {completedOrder.orderNumber}
                </strong>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(completedOrder.orderNumber);
                      setCopiedOrderNumber(true);
                      setTimeout(() => setCopiedOrderNumber(false), 2000);
                    } catch {
                      alert('Order number copy nahi ho saka. Please manually save kar lein.');
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded border border-[#B88932] px-3 py-2 text-xs font-semibold text-[#FFD76A]"
                >
                  {copiedOrderNumber ? <Check size={14} /> : <Copy size={14} />}
                  {copiedOrderNumber ? 'Copied!' : 'Copy Order Number'}
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-[#241C0D] border border-[#A77A2B]/50 p-3 text-xs text-[#F3D27A] space-y-1">
              <p className="font-bold">Important — Save Your Order Details</p>
              <p>
                Please save your Order Number and remember the phone number
                you entered at checkout. You will need both to track your shipment.
              </p>
              <p><strong>Registered Phone Number:</strong> {completedOrder.customerPhone}</p>
            </div>

            <a
              href="/track-order"
              className="block w-full bg-gradient-to-r from-[#C58A22] via-[#FFE08A] to-[#C58A22] hover:brightness-110 text-[#17110A] text-center font-bold py-3 rounded-xl text-sm transition-all"
            >
              Track Your Order
            </a>
          </div>

          <div className="bg-[#171717] p-4 rounded-lg border text-left text-xs space-y-2 mb-6">
            <p><strong>Name:</strong> {completedOrder.customerName}</p>
            <p><strong>Address:</strong> {completedOrder.deliveryAddress}, {completedOrder.city}</p>
            <p><strong>Payment:</strong> {completedOrder.paymentMethod}</p>
            <p><strong>Total Payable:</strong> PKR {completedOrder.total.toLocaleString()} /-</p>

            {completedOrder.paymentScreenshot && (
              <p className="text-[#E7BC5D] font-semibold">
                Payment Screenshot Submitted — Verification Pending
              </p>
            )}
          </div>

          <div className="space-y-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#186D43] hover:bg-[#1C8451] text-white font-bold py-3 rounded-md text-sm transition-colors"
            >
              📲 Send Order Confirmation via WhatsApp
            </a>

            <a href="/" className="block text-xs text-[#FFD76A] font-bold hover:underline">
              Return to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F0E6] px-4 sm:px-6 py-10">
      <h1 className="max-w-7xl mx-auto text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0A5] via-[#E9BA49] to-[#C58A22] mb-8">
        Checkout & Delivery Details
      </h1>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form
          onSubmit={handleSubmitOrder}
          className="lg:col-span-2 bg-[#151515] p-5 sm:p-7 border border-[#8C692F]/50 rounded-2xl space-y-5 shadow-[0_15px_40px_rgba(0,0,0,0.25)]"
        >
          <h2 className="font-bold text-[#FFD76A] text-base mb-2">
            Shipping Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#D1C2A7] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Muhammad Ali"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full p-3 border border-[#A47B34]/60 rounded-lg text-sm bg-[#101010] text-[#F7E8C3] placeholder:text-[#8F8678] focus:outline-[#E7B84F]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#D1C2A7] mb-1">
                Mobile Number (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                placeholder="03451840478"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full p-3 border border-[#A47B34]/60 rounded-lg text-sm bg-[#101010] text-[#F7E8C3] placeholder:text-[#8F8678] focus:outline-[#E7B84F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D1C2A7] mb-1">
                City *
              </label>
              <input
                list="pakistani-cities"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Type to search your city"
                className="w-full p-3 border border-[#A47B34]/60 rounded-lg text-sm bg-[#101010] text-[#F7E8C3] placeholder:text-[#8F8678] focus:outline-[#E7B84F]"
              />
              <datalist id="pakistani-cities">
                {pakistaniCities.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D1C2A7] mb-1">
              Complete Street / House Address *
            </label>
            <textarea
              required
              rows={3}
              placeholder="House #, Street #, Sector/Mohallah..."
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              className="w-full p-3 border border-[#A47B34]/60 rounded-lg text-sm bg-[#101010] text-[#F7E8C3] placeholder:text-[#8F8678] focus:outline-[#E7B84F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D1C2A7] mb-1">
              Order Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Deliver before 5 PM"
              value={formData.orderNotes}
              onChange={(e) => setFormData({ ...formData, orderNotes: e.target.value })}
              className="w-full p-3 border border-[#A47B34]/60 rounded-lg text-sm bg-[#101010] text-[#F7E8C3] placeholder:text-[#8F8678] focus:outline-[#E7B84F]"
            />
          </div>

          <div className="pt-4 border-t border-[#8C692F]/40">
            <label className="font-bold text-xs text-[#D1C2A7] block mb-2">
              Payment Method
            </label>

            <select
              value={formData.paymentMethod}
              onChange={(e) => {
                setFormData({ ...formData, paymentMethod: e.target.value });
                setCopiedAccount('');
                setPaymentScreenshot(null);
              }}
              className="w-full border border-[#A47B34]/60 rounded-lg p-3 text-sm bg-[#101010] text-[#F7E8C3] focus:outline-[#E7B84F]"
            >
              <option>Cash on Delivery (COD)</option>
              <option>JazzCash (Manual Transfer)</option>
              <option>Easypaisa (Manual Transfer)</option>
              <option>Bank Transfer</option>
            </select>

            {formData.paymentMethod === 'JazzCash (Manual Transfer)' && (
              <div className="mt-3 rounded-lg border border-[#8D5148]/50 bg-[#241818] p-4 space-y-3">
                <h3 className="font-bold text-[#FFBBAA] text-sm">JazzCash Payment Details</h3>

                <div>
                  <p className="text-xs text-[#BEB19D]">Account Title</p>
                  <p className="font-bold text-[#F4E5C4]">Hammad Ul Qudoos</p>
                </div>

                <div>
                  <p className="text-xs text-[#BEB19D] mb-1">JazzCash Account Number</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#F4E5C4] tracking-wide">03096467165</p>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount('03096467165', 'jazzcash')}
                      className="flex items-center gap-1 rounded bg-[#171717] border border-[#A47B34]/60 px-3 py-2 text-xs font-semibold text-[#E8D7B6] hover:bg-[#302514]"
                    >
                      {copiedAccount === 'jazzcash' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedAccount === 'jazzcash' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {formData.paymentMethod === 'Bank Transfer' && (
              <div className="mt-3 rounded-lg border border-[#B88932]/40 bg-[#151515] p-4 space-y-3">
                <h3 className="font-bold text-[#FFD76A] text-sm">Meezan Bank Transfer Details</h3>

                <div>
                  <p className="text-xs text-[#BEB19D]">Bank Name</p>
                  <p className="font-bold text-[#F4E5C4]">Meezan Bank</p>
                </div>

                <div>
                  <p className="text-xs text-[#BEB19D]">Account Title</p>
                  <p className="font-bold text-[#F4E5C4]">HAMMADAL QUDDUS</p>
                </div>

                <div>
                  <p className="text-xs text-[#BEB19D] mb-1">Account Number</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#F4E5C4] tracking-wide">38010115303546</p>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount('38010115303546', 'meezan')}
                      className="flex items-center gap-1 rounded bg-[#171717] border border-[#A47B34]/60 px-3 py-2 text-xs font-semibold text-[#E8D7B6] hover:bg-[#302514]"
                    >
                      {copiedAccount === 'meezan' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedAccount === 'meezan' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {formData.paymentMethod === 'Easypaisa (Manual Transfer)' && (
              <div className="mt-3 rounded-lg border border-[#A77A2B]/50 bg-[#241C0D] p-4">
                <h3 className="font-bold text-[#F3D27A] text-sm">Easypaisa</h3>
                <p className="text-xs text-[#E5C67A] mt-1">
                  Easypaisa payment details will be available soon. Please contact us on WhatsApp for assistance.
                </p>
              </div>
            )}

            {isOnlinePayment && (
              <div className="mt-3 rounded-lg border border-[#627DA5]/50 bg-[#171D27] p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-[#BBD5FF] text-sm flex items-center gap-2">
                    <Upload size={16} />
                    Upload Payment Screenshot *
                  </h3>
                  <p className="text-xs text-[#A9C7EE] mt-1">
                    Transfer karne ke baad payment receipt ka screenshot upload karein.
                    JPG, PNG ya WEBP — maximum 5 MB.
                  </p>
                </div>

                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#728EBA]/60 bg-[#171717] rounded-lg p-4 cursor-pointer hover:bg-[#171D27]">
                  <ImageIcon size={20} className="text-[#BBD5FF]" />
                  <span className="text-sm font-semibold text-[#BBD5FF]">
                    {paymentScreenshot ? 'Change Screenshot' : 'Choose Screenshot'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </label>

                {paymentScreenshot && (
                  <p className="text-xs text-[#EAC46C] font-semibold">
                    <Check size={14} className="inline mr-1" />
                    Selected: {paymentScreenshot.name}
                  </p>
                )}
              </div>
            )}

            {isOnlinePayment && (
              <p className="text-xs text-[#D1C2A7] bg-[#1B1B1B] border border-[#8C692F]/40 rounded p-3 mt-3">
                Please do not send payment until your order and payment details have been confirmed by our team.
                Uploaded screenshots will remain Pending Verification until checked by our team.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || checkoutItems.length === 0}
            className="w-full bg-gradient-to-r from-[#C58A22] via-[#FFE08A] to-[#C58A22] hover:brightness-110 disabled:opacity-60 text-[#17110A] font-extrabold py-4 rounded-xl text-sm transition-all mt-4"
          >
            {submitting ? 'Uploading Screenshot & Placing Order...' : 'Place Order'}
          </button>
        </form>

        {/* Sidebar Summary */}
        <div className="bg-[#151515] p-6 border border-[#8C692F]/50 rounded-2xl h-fit space-y-5 lg:sticky lg:top-28">
          <h2 className="font-bold text-[#F5D780] border-b border-[#8C692F]/40 pb-2 text-base">
            Your Order ({checkoutItems.length} items)
          </h2>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {checkoutItems.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#F4E5C4]">{item.name}</span>
                  <span className="block text-[#AFA38F]">Qty: {item.quantity}</span>
                </div>
                <span className="font-bold text-[#FFD76A]">
                  PKR {(item.price * item.quantity).toLocaleString()} /-
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#8C692F]/40 pt-4 space-y-2">
            <label className="text-xs font-semibold text-[#F5D780]">Discount Coupon</label>
            <div className="flex gap-2">
              <input type="text" value={couponInput} onChange={e => { setCouponInput(e.target.value.toUpperCase()); setAppliedCoupon(null); }} placeholder="Enter coupon code" className="min-w-0 flex-1 bg-[#0e0e0e] border border-[#8C692F] text-white rounded-lg p-2 text-sm" />
              <button type="button" onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()} className="bg-[#D8AD50] text-black font-bold rounded-lg px-3 text-sm disabled:opacity-50">{couponBusy ? 'Checking...' : 'Apply'}</button>
            </div>
            {couponError && <p className="text-red-400 text-xs">{couponError}</p>}
            {appliedCoupon && couponDiscount > 0 && <p className="text-green-400 text-xs">{appliedCoupon.code} applied — PKR {couponDiscount.toLocaleString()} /- off!</p>}
          </div>

          <div className="border-t border-[#8C692F]/40 pt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#BEB19D]">Subtotal</span>
              <span className="font-bold">PKR {checkoutSubtotal.toLocaleString()} /-</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#BEB19D]">Delivery Fee</span>
              <span className="font-bold">PKR {deliveryFee.toLocaleString()} /-</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#BEB19D]">COD Charges</span>
              <span className="font-bold">
                PKR {codCharges.toLocaleString()} /-
              </span>
            </div>

            {couponDiscount > 0 && <div className="flex justify-between text-green-400"><span>Coupon Discount</span><span>- PKR {couponDiscount.toLocaleString()} /-</span></div>}
            <div className="flex justify-between text-sm font-bold text-[#FFD76A] border-t border-[#8C692F]/40 pt-2 mt-2">
              <span>Grand Total</span>
              <span>PKR {orderTotal.toLocaleString()} /-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}