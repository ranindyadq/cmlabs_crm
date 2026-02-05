export default function OverviewTab({ member }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">About</h3>

        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-700">Bio</h4>
          <p className="text-sm text-gray-600 mt-1">{member.bio}</p>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700">Skills</h4>
          <div className="flex gap-2 flex-wrap mt-2">
            {member.skills.map((skill: string) => (
              <span
                key={skill}
                className="text-xs bg-gray-100 px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700">Reports To</h4>
          <p className="text-sm text-gray-500 mt-1">
            {/* Jika nanti sudah ada relasi manager di member, ganti member.managerName */}
            {member.reportsTo || "No manager assigned."}
          </p>
        </div>
      </div>
    </div>
  );
}
