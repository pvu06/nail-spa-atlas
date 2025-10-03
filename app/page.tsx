"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, MapPin, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              NailSpa Atlas
            </h1>
          </div>
          <Link href="/analyze">
            <Button size="lg">
              Start Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Nail Salon Competitor Analyzer
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            So sánh giá, nhân sự, rating và dịch vụ với các đối thủ trong khu vực của bạn.
            Phân tích chi tiết để giúp salon của bạn cạnh tranh hiệu quả hơn.
          </p>
          <Link href="/analyze">
            <Button size="lg" className="text-lg px-8 py-6 rounded-xl">
              Bắt Đầu Phân Tích
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-3xl font-bold text-center mb-12">Tính Năng Chính</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-purple-200">
              <CardContent className="p-6 text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="text-xl font-bold mb-2">Tìm Kiếm Địa Lý</h4>
                <p className="text-gray-600 text-sm">
                  Tìm và phân tích các đối thủ trong bán kính tùy chỉnh từ vị trí của bạn
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold mb-2">So Sánh Giá</h4>
                <p className="text-gray-600 text-sm">
                  Phân tích giá dịch vụ và tìm vị trí cạnh tranh tối ưu của bạn
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-green-200">
              <CardContent className="p-6 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-xl font-bold mb-2">Phân Tích Nhân Sự</h4>
                <p className="text-gray-600 text-sm">
                  So sánh quy mô nhân viên và giờ hoạt động với đối thủ
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-orange-200">
              <CardContent className="p-6 text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="text-xl font-bold mb-2">Biểu Đồ Trực Quan</h4>
                <p className="text-gray-600 text-sm">
                  Dễ dàng hiểu dữ liệu qua các biểu đồ radar và cột tương tác
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="rounded-3xl shadow-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white border-0">
            <CardContent className="p-12 text-center">
              <h3 className="text-4xl font-bold mb-4">Sẵn Sàng Bắt Đầu?</h3>
              <p className="text-xl mb-8 text-purple-100">
                Phân tích đối thủ của bạn chỉ trong vài phút
              </p>
              <Link href="/analyze">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 rounded-xl">
                  Phân Tích Ngay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2025 NailSpa Atlas. Built with Next.js 14 & TypeScript.</p>
        </div>
      </footer>
    </div>
  );
}