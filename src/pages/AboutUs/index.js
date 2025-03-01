import React from "react";

const AboutUS = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-5xl font-bold text-blue-800 mb-6">Swasthya Seva</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Revolutionizing healthcare management with a comprehensive platform
          connecting patients, doctors, and administrators.
        </p>
      </section>

      {/* About Platform Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-blue-800 mb-4">
            Our Platform
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Swasthya Seva is built to streamline healthcare processes, enhance
            patient care, and enable efficient medical management.
          </p>
        </div>

        {/* User Features */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-blue-700 mb-8 flex items-center">
            <span className="mr-2 text-blue-600">👥</span>
            For Patients
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📅"
              title="Easy Appointment Booking"
              description="Schedule appointments and lab tests with just a few clicks, saving time and reducing hassle."
            />
            <FeatureCard
              icon="📄"
              title="Medical Record Management"
              description="Securely store and access your medical reports and visit summaries in one centralized location."
            />
            <FeatureCard
              icon="🔔"
              title="Timely Reminders"
              description="Receive email reminders for upcoming appointments and medication schedules."
            />
            <FeatureCard
              icon="💬"
              title="Support & Feedback"
              description="Submit feedback or raise support tickets for any assistance you need with our platform."
            />
          </div>
        </div>

        {/* Doctor Features */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-blue-700 mb-8 flex items-center">
            <span className="mr-2 text-blue-600">❤️</span>
            For Doctors
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="👥"
              title="Enhanced Reach"
              description="Connect with more patients and expand your practice through our platform."
            />
            <FeatureCard
              icon="📄"
              title="Comprehensive Patient History"
              description="Access complete patient histories including past diagnoses to provide better care."
            />
            <FeatureCard
              icon="📅"
              title="Appointment Management"
              description="Easily schedule, reschedule, and manage your appointments with an intuitive interface."
            />
            <FeatureCard
              icon="📋"
              title="Medication Management"
              description="Check medication availability in real-time and suggest alternatives when needed."
            />
          </div>
        </div>

        {/* Admin Features */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-blue-700 mb-8 flex items-center">
            <span className="mr-2 text-blue-600">📊</span>
            For Administrators
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="👥"
              title="User Management"
              description="Approve doctors, manage users, and maintain platform integrity."
            />
            <FeatureCard
              icon="⚠️"
              title="Complaint Resolution"
              description="Track and resolve complaints with an automated 48-hour resolution system."
            />
            <FeatureCard
              icon="📊"
              title="Analytics & Reporting"
              description="Generate comprehensive reports on platform usage and performance metrics."
            />
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="bg-blue-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8 ">
            Why We Built Swasthya Seva
          </h2>
          <p className="text-lg mb-6 text-white">
            We recognized the challenges in healthcare management—fragmented
            records, communication gaps between doctors and patients, and
            administrative inefficiencies. Swasthya Seva was born from our
            vision to create an integrated ecosystem where healthcare becomes
            more accessible, efficient, and patient-centric.
          </p>
          <p className="text-lg mb-6 text-white">
            We believe health is something that should never be compromised. Yet
            we've seen how patients from rural villages travel long distances
            only to make multiple trips because they lack proper documentation
            or medical history.
          </p>
          <p className="text-lg mb-6 text-white">
            Our platform helps doctors make more precise treatment decisions by
            providing complete patient records in one place. And for patients,
            especially those from remote areas, we've designed a system that's
            simple and intuitive to use, eliminating unnecessary hospital
            visits.
          </p>
          <p className="text-lg mb-6 text-white">
            Using cutting-edge technologies like React for the frontend and
            Firebase for backend services, we've created a platform that not
            only addresses current healthcare challenges but is also scalable
            for future innovations.
          </p>
          <p className="text-lg text-white">
            In the coming months, we plan to upload tutorial videos to our
            website, helping both healthcare providers and patients make the
            most of Swasthya Seva's features.
          </p>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-blue-800 mb-4">
            Meet Our Team
          </h2>
          <p className="text-lg text-gray-600">
            The brilliant minds behind Swasthya Seva, committed to transforming
            healthcare management.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          <TeamCard
            name="Ambuj Tripathi"
            role="Backend & Developer"
            imageUrl="/api/placeholder/300/300"
          />
          <TeamCard
            name="Manya Choradiya"
            role="UX Designer & Developer & Backend"
            imageUrl="/api/placeholder/300/300"
          />
          <TeamCard
            name="Daksh Dhola"
            role="UX Designer & Developer"
            imageUrl="/api/placeholder/300/300"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Join the Healthcare Revolution
        </h2>
        <p className="text-xl max-w-3xl mx-auto mb-8">
          Experience a new standard in healthcare management with Swasthya Seva.
        </p>
        <button className="bg-white text-blue-800 px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-100 transition-colors flex items-center mx-auto">
          Get Started
          <span className="ml-2">→</span>
        </button>
      </section>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
      <div className="text-blue-600 mb-4 text-2xl">{icon}</div>
      <h4 className="text-xl font-semibold mb-2 text-gray-800">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

// Team Card Component
const TeamCard = ({ name, role, imageUrl }) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <div className="h-64 bg-gray-200">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="p-6 text-center">
        <h4 className="text-xl font-bold text-gray-800 mb-1">{name}</h4>
        <p className="text-blue-600">{role}</p>
      </div>
    </div>
  );
};

export default AboutUS;
