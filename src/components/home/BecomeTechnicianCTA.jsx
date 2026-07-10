import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Wrench, ArrowRight, DollarSign, Calendar, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const benefits = [
  { icon: DollarSign, title: 'Earn on your terms', desc: 'Set your own rates and get paid fast' },
  { icon: Calendar, title: 'Flexible schedule', desc: 'Work when it suits you best' },
  { icon: ShieldCheck, title: 'Get verified', desc: 'Build trust with a verified badge' },
];

export default function BecomeTechnicianCTA() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-10 md:py-14">
      <div className="relative overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(135deg, #0B463C 0%, #197B6B 100%)' }}>
        <div className="relative z-10 p-6 sm:p-10 md:p-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-5">
              <Wrench className="w-3.5 h-3.5 text-white mr-2" />
              <span className="text-xs font-medium text-white tracking-wide">For Professionals</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4 leading-tight">
              Are you a skilled technician? Join Fixie.
            </h2>

            <p className="text-white/80 text-sm sm:text-base mb-8 max-w-lg leading-relaxed">
              Reach thousands of customers looking for trusted pros. Register today, get verified, and start receiving jobs in your area.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                      <p className="text-white/60 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="bg-white text-[#0B463C] hover:bg-white/90 rounded-xl font-semibold"
              >
                <Link to={createPageUrl('TechnicianRegister')}>
                  Register as Technician <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl font-medium"
              >
                <Link to={createPageUrl('Services')}>
                  Browse Available Jobs
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}