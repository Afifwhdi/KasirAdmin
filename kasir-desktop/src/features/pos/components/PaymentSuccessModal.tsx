import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Lottie from "lottie-react";
import successAnimationData from "@/assets/Succesanimation.json";

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  orderId: string;
  paymentMethod: string;
  paymentTime: string;
  onNewOrder: () => void;
  onPrintReceipt?: () => void;
}

const successAnimation = successAnimationData as Record<string, unknown>;

const oldAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 90,
  w: 300,
  h: 300,
  nm: "Success Check",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            {
              i: { x: [0.42], y: [1] },
              o: { x: [0.58], y: [0] },
              t: 0,
              s: [0, 0, 100],
            },
            { t: 30, s: [100, 100, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [120, 120] },
              p: { a: 0, k: [0, 0] },
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.133, 0.694, 0.298, 1] },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Check",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ind: 0,
              ty: "sh",
              ks: {
                a: 1,
                k: [
                  {
                    i: { x: 0.42, y: 1 },
                    o: { x: 0.58, y: 0 },
                    t: 20,
                    s: [
                      {
                        i: [
                          [0, 0],
                          [0, 0],
                          [0, 0],
                        ],
                        o: [
                          [0, 0],
                          [0, 0],
                          [0, 0],
                        ],
                        v: [
                          [-25, 0],
                          [-25, 0],
                          [-25, 0],
                        ],
                        c: false,
                      },
                    ],
                  },
                  {
                    t: 50,
                    s: [
                      {
                        i: [
                          [0, 0],
                          [0, 0],
                          [0, 0],
                        ],
                        o: [
                          [0, 0],
                          [0, 0],
                          [0, 0],
                        ],
                        v: [
                          [-25, 0],
                          [-10, 15],
                          [25, -25],
                        ],
                        c: false,
                      },
                    ],
                  },
                ],
              },
            },
            {
              ty: "st",
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 8 },
              lc: 2,
              lj: 2,
            },
          ],
        },
      ],
      ip: 20,
      op: 90,
      st: 0,
    },
  ],
};

export const PaymentSuccessModal = ({
  open,
  onClose,
  amount,
  orderId,
  paymentMethod,
  paymentTime,
  onNewOrder,
  onPrintReceipt,
}: PaymentSuccessModalProps) => {
  // const lottieRef = useRef(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (open) {
      setCountdown(3);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const timer = setTimeout(() => {
        onNewOrder();
      }, 3000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [open, onNewOrder]);

  const handleNewOrder = () => {
    onClose();
    onNewOrder();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-8 text-center">
          {/* Lottie Animation */}
          {/* <div className="w-32 h-32 mx-auto mb-4">
            <Lottie
              lottieRef={lottieRef}
              animationData={successAnimation}
              loop={false}
              autoplay={true}
            />
          </div> */}

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Success!
          </h2>

          {/* Amount */}
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            Rp {amount.toLocaleString("id-ID")}
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-semibold">{orderId}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-semibold">{paymentMethod}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Time</span>
              <span className="font-semibold">{paymentTime}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <Button
              onClick={handleNewOrder}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
              size="lg"
            >
              New Order
            </Button>

            {onPrintReceipt && (
              <Button
                onClick={onPrintReceipt}
                variant="outline"
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
            )}
          </div>

          {/* Auto close message */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            {countdown > 0
              ? `Auto close in ${countdown} second${countdown !== 1 ? "s" : ""}...`
              : "Closing..."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
