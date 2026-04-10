import SwiftData
import Foundation

@Model
final class Cat {
    var name: String
    var breed: String
    var birthdate: Date?
    var emoji: String

    @Relationship(deleteRule: .cascade, inverse: \TreatmentRecord.cat)
    var records: [TreatmentRecord] = []

    init(name: String, breed: String = "", birthdate: Date? = nil, emoji: String = "🐱") {
        self.name = name
        self.breed = breed
        self.birthdate = birthdate
        self.emoji = emoji
    }

    var age: String {
        guard let birthdate else { return "" }
        let comps = Calendar.current.dateComponents([.year, .month], from: birthdate, to: Date())
        let years = comps.year ?? 0
        let months = comps.month ?? 0
        if years == 0 { return "\(months) мес." }
        if months == 0 { return "\(years) г." }
        return "\(years) г. \(months) мес."
    }

    var overdueCount: Int  { records.filter { $0.status == .overdue }.count }
    var upcomingCount: Int { records.filter { $0.status == .upcoming }.count }
}
